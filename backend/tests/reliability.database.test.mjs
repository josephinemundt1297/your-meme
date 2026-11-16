import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

import {createMemeService} from "../dist/modules/memes/meme.service.js";
import test from "node:test";
// Nur ausdrücklich starten: RUN_DATABASE_TESTS=1 npm test
// Verwendet ausschließlich eigene temporäre Datensätze; niemals echte Bilder.
test("PostgreSQL: durable cleanup, cascades and atomic rollback", {
  skip: process.env.RUN_DATABASE_TESTS !== "1",
}, async () => {
const { prisma } = await import("../dist/lib/prisma.js");
const target = new URL(process.env.DATABASE_URL);
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname));
assert.equal(target.pathname, "/your_meme_db");
const clerkId=`reliability-test:${randomUUID()}`;
let user;
const created=[];
try {
 const before=await prisma.meme.count();
 user=await prisma.user.create({data:{clerkId,username:'Reliability-Test (vorübergehend)'}});
 const makeMeme=async()=>{const row=await prisma.meme.create({data:{title:'Eigenes Test-Meme',userId:user.id,imageUrl:'https://images.example/no-real-image.png',imageStorageId:`test-only/${randomUUID()}`}});created.push(row.id);return row;};
 const meme=await makeMeme();
 const folder=await prisma.folder.create({data:{name:'Testordner',userId:user.id}});
 await prisma.comment.create({data:{content:'Test',userId:user.id,memeId:meme.id}});
 await prisma.like.create({data:{userId:user.id,memeId:meme.id}});
 await prisma.folderMeme.create({data:{folderId:folder.id,memeId:meme.id}});
 let calls=0;
 const storage={upload:async()=>{throw new Error('No upload');},destroy:async()=>{calls++;assert.equal(await prisma.meme.count({where:{id:meme.id}}),0);assert.equal(await prisma.memeImageDeletion.count({where:{memeId:meme.id}}),1);throw new Error('Simulated Cloudinary failure');}};
 await assert.rejects(createMemeService({database:prisma,imageStorage:storage}).deleteMeme(meme.id,clerkId),error=>error.status===503);
 assert.equal(await prisma.comment.count({where:{memeId:meme.id}}),0);
 assert.equal(await prisma.like.count({where:{memeId:meme.id}}),0);
 assert.equal(await prisma.folderMeme.count({where:{memeId:meme.id}}),0);
 assert.equal(await prisma.folder.count({where:{id:folder.id}}),1);
 assert.equal(calls,1);
 // Neue Instanz: persistierter Auftrag wird nach Ausfall weiterverarbeitet.
 const retryStorage={upload:storage.upload,destroy:async()=>({result:'not found'})};
 await createMemeService({database:prisma,imageStorage:retryStorage}).deleteMeme(meme.id,clerkId);
 assert.equal(await prisma.memeImageDeletion.count({where:{memeId:meme.id}}),0);
 const rollbackMeme=await makeMeme();
 const database={...prisma,$transaction:callback=>prisma.$transaction(tx=>callback({...tx,meme:{...tx.meme,delete:async()=>{throw new Error('Simulated SQL failure');}}}))};
 let forbiddenImageCalls=0;
 await assert.rejects(createMemeService({database,imageStorage:{upload:storage.upload,destroy:async()=>{forbiddenImageCalls++;return{result:'ok'};}}}).deleteMeme(rollbackMeme.id,clerkId));
 assert.equal(await prisma.meme.count({where:{id:rollbackMeme.id}}),1);
 assert.equal(await prisma.memeImageDeletion.count({where:{memeId:rollbackMeme.id}}),0);
 assert.equal(forbiddenImageCalls,0);
 console.log(JSON.stringify({checks:'Real SQL transaction rollback, cascades, pending job persistence, owner retry after new service instance and job removal passed; Cloudinary fully simulated',existingMemes:before}));
} finally {
 if(user){await prisma.memeImageDeletion.deleteMany({where:{memeId:{in:created}}});await prisma.user.deleteMany({where:{id:user.id}});}
 console.log(JSON.stringify({temporaryJobsRemaining:await prisma.memeImageDeletion.count({where:{memeId:{in:created}}}),temporaryUsersRemaining:await prisma.user.count({where:{clerkId}}),memesAfterCleanup:await prisma.meme.count()}));
 await prisma.$disconnect();
}

});
