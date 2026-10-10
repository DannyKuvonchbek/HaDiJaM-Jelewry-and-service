// Uses a disposable replica set only. Install mongodb-memory-server separately
// and provide MONGODB_MEMORY_SERVER_MODULE; never connects to the application DB.
require("reflect-metadata");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MongoMemoryReplSet } = require(
  process.env.MONGODB_MEMORY_SERVER_MODULE || "mongodb-memory-server",
);
async function main() {
  const privateDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "hadijam-doc-tests-"),
  );
  const repl = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { downloadDir: path.join(os.tmpdir(), "hadijam-mongo-binaries") },
  });
  let app, gateway;
  try {
    process.env.MONGODB_URI = repl.getUri("seller-approval-test");
    process.env.JWT_SECRET = "isolated-integration-test-secret-only";
    process.env.SMS_ENABLED = "false";
    process.env.PRIVATE_DOCUMENT_DIR = privateDir;
    const { NestFactory } = require("@nestjs/core");
    const { ValidationPipe } = require("@nestjs/common");
    const { graphqlUploadExpress } = require("graphql-upload");
    const { AppModule } = require("../dist/app.module");
    app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    app.useWebSocketAdapter(
      new (require("@nestjs/platform-ws").WsAdapter)(app),
    );
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.use(
      "/graphql",
      graphqlUploadExpress({ maxFileSize: 25000000, maxFiles: 10 }),
    );
    await app.listen(0, "127.0.0.1");
    const connection = app.get(
      require("@nestjs/mongoose").getConnectionToken(),
    );
    await Promise.all(Object.values(connection.models).map((m) => m.init()));
    // Validate the real frontend GraphQL documents against the running backend schema.
    const ts = require("typescript");
    require.extensions[".ts"] = (module, filename) => {
      const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2021,
          esModuleInterop: true,
        },
      });
      module._compile(output.outputText, filename);
    };
    const frontendSource = fs.readFileSync(path.resolve(__dirname, "../../Hadijam    frontend/libs/graphql/sellerApproval.ts"), "utf8");
    const templates = Array.from(frontendSource.matchAll(/gql`([\s\S]*?)`/g), match => match[1]);
    const frontendOperations = templates.slice(1).map(text => require("graphql").parse(text.replace("${applicationFields}", templates[0])));
    const schema = app.get(require("@nestjs/graphql").GraphQLSchemaHost).schema;
    for (const document of Object.values(frontendOperations)) {
      if (document?.kind === "Document")
        assert.deepEqual(require("graphql").validate(schema, document), []);
    }
    const base = await app.getUrl();
    const gql = async (query, variables = {}, token) => {
      const res = await fetch(base + "/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": "http://localhost:1017",
          "X-Hadijam-CSRF": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
      });
      return res.json();
    };
    const ok = async (...args) => {
      const result = await gql(...args);
      assert.equal(result.errors, undefined, JSON.stringify(result.errors));
      return result.data;
    };
    const signup =
      "mutation($input:MemberInput!){signup(input:$input){_id memberType accessToken}}";
    const login =
      "mutation($input:LoginInput!){login(input:$input){_id memberType accessToken}}";
    const userInput = {
      memberNick: "sellerTest",
      memberPassword: "validPassword123",
      memberPhone: "01012345678",
      memberType: "SELLER",
    };
    const user = (await ok(signup, { input: userInput })).signup;
    assert.equal(user.memberType, "USER");
    const other = (
      await ok(signup, {
        input: {
          ...userInput,
          memberNick: "otherUser",
          memberPhone: "+998901234568",
        },
      })
    ).signup;
    assert.ok(
      (
        await gql(signup, {
          input: {
            ...userInput,
            memberNick: "fakeAdmin",
            memberPhone: "+998901234569",
            memberType: "ADMIN",
          },
        })
      ).errors,
    );
    const socialQuery = 'query($atelier:String!){getAtelierSocial(atelier:$atelier){likes followers liked followed}}';
    const setLike = 'mutation($atelier:String!,$liked:Boolean!){setAtelierLike(atelier:$atelier,liked:$liked){likes liked}}';
    const setFollow = 'mutation($atelier:String!,$followed:Boolean!){setAtelierFollow(atelier:$atelier,followed:$followed){followers followed}}';
    const atelier = 'kang-and-sons';
    assert.ok((await gql(setLike, { atelier, liked: true })).errors);
    await Promise.all([ok(setLike, { atelier, liked: true }, user.accessToken), ok(setLike, { atelier, liked: true }, user.accessToken)]);
    assert.deepEqual((await ok(socialQuery, { atelier }, user.accessToken)).getAtelierSocial, { likes: 1, followers: 0, liked: true, followed: false });
    await ok(setFollow, { atelier, followed: true }, user.accessToken);
    await ok(setFollow, { atelier, followed: true }, user.accessToken);
    assert.deepEqual((await ok(socialQuery, { atelier }, other.accessToken)).getAtelierSocial, { likes: 1, followers: 1, liked: false, followed: false });
    for (const distinct of ['aurum-gemological-lab', 'milano-heritage-restoration']) {
      assert.deepEqual((await ok(socialQuery, { atelier: distinct }, user.accessToken)).getAtelierSocial, { likes: 0, followers: 0, liked: false, followed: false });
      await ok(setLike, { atelier: distinct, liked: true }, user.accessToken);
      await ok(setFollow, { atelier: distinct, followed: true }, user.accessToken);
    }
    await ok(setLike, { atelier, liked: false }, user.accessToken);
    await ok(setFollow, { atelier, followed: false }, user.accessToken);
    assert.equal((await ok(socialQuery, { atelier })).getAtelierSocial.likes, 0);
    assert.ok((await gql(socialQuery, { atelier: 'unknown' })).errors);
    const members = connection.model("Member");
    const adminDoc = await members.create({
      memberNick: "adminTest",
      memberPhone: "+998901234570",
      memberPassword: await bcrypt.hash("adminPassword123", 4),
      memberType: "ADMIN",
    });
    const admin = (
      await ok(login, {
        input: { memberNick: "adminTest", memberPassword: "adminPassword123" },
      })
    ).login;
    const list =
      "query($input:AdminPageInput!){getSellerApplicationsByAdmin(input:$input){total pendingCount list{_id revision status memberNick}}}";
    assert.ok(
      (await gql(list, { input: { page: 1, limit: 20 } }, user.accessToken))
        .errors,
    );
    assert.equal(
      (await ok(list, { input: { page: 1, limit: 20 } }, admin.accessToken))
        .getSellerApplicationsByAdmin.total,
      0,
    );
    const upload = async (token, size = 20, type = "image/png") => {
      const body = new FormData();
      const bytes = Buffer.alloc(size);
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
      body.append("file", new Blob([bytes], { type }), "proof.png");
      return fetch(base + "/seller-documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
    };
    const doc1 = await (await upload(user.accessToken)).json();
    const doc2 = await (await upload(user.accessToken)).json();
    assert.ok(doc1.documentId && doc2.documentId);
    const ownDocuments = await (await fetch(base + "/seller-documents", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    })).json();
    assert.equal(ownDocuments.length, 2);
    assert.ok(ownDocuments.every((doc) => !doc.storagePath));
    const otherDocuments = await (await fetch(base + "/seller-documents", {
      headers: { Authorization: `Bearer ${other.accessToken}` },
    })).json();
    assert.equal(otherDocuments.length, 0);
    assert.equal(
      (await upload(user.accessToken, 10 * 1024 * 1024 + 1)).status,
      413,
    );
    assert.equal(
      (await upload(user.accessToken, 20, "text/plain")).status,
      400,
    );
    assert.equal(
      (await fetch(base + "/seller-documents/" + doc1.documentId)).status,
      401,
    );
    assert.equal(
      (
        await fetch(base + "/seller-documents/" + doc1.documentId, {
          headers: { Authorization: `Bearer ${other.accessToken}` },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await fetch(base + "/seller-documents/" + doc1.documentId, {
          headers: { Authorization: `Bearer ${admin.accessToken}` },
        })
      ).status,
      200,
    );
    const submit =
      "mutation($input:SellerApplicationInput!){submitSellerApplication(input:$input){_id status revision}}";
    const input = {
      businessName: "Test Atelier",
      businessAddress: "Seoul test business address",
      idDocumentId: doc1.documentId,
      businessDocumentId: doc2.documentId,
    };
    assert.ok((await gql(submit, { input }, other.accessToken)).errors);
    const submitted = await Promise.all([
      ok(submit, { input }, user.accessToken),
      ok(submit, { input }, user.accessToken),
    ]);
    const application = submitted[0].submitSellerApplication;
    assert.equal(application._id, submitted[1].submitSellerApplication._id);
    assert.equal(
      await connection.model("SellerApplication").countDocuments(),
      1,
    );
    assert.equal(
      (await ok(list, { input: { page: 1, limit: 20 } }, admin.accessToken))
        .getSellerApplicationsByAdmin.pendingCount,
      1,
    );
    const inbox =
      "query{getMyNotifications(input:{page:1,limit:50}){unreadCount list{_id notificationTitle notificationDesc}}}";
    assert.equal(
      (await ok(inbox, {}, user.accessToken)).getMyNotifications.unreadCount,
      1,
    );
    assert.equal(
      (await ok(inbox, {}, admin.accessToken)).getMyNotifications.unreadCount,
      1,
    );
    const review =
      "mutation($input:SellerReviewInput!){reviewSellerApplication(input:$input){_id status revision}}";
    const decision = {
      applicationId: application._id,
      revision: application.revision,
      decision: "APPROVED",
    };
    assert.ok(
      (await gql(review, { input: decision }, other.accessToken)).errors,
    );
    // A notification write failure must roll back role/application changes.
    const notificationModel = connection.model("Notification");
    const originalCreate = notificationModel.create;
    notificationModel.create = async () => {
      throw new Error("Injected notification failure");
    };
    try {
      assert.ok(
        (await gql(review, { input: decision }, admin.accessToken)).errors,
      );
    } finally {
      notificationModel.create = originalCreate;
    }
    assert.equal((await members.findById(user._id).lean()).memberType, "USER");
    assert.equal(
      (
        await connection
          .model("SellerApplication")
          .findById(application._id)
          .lean()
      ).status,
      "PENDING",
    );
    await Promise.all([
      ok(review, { input: decision }, admin.accessToken),
      ok(review, { input: decision }, admin.accessToken),
    ]);
    const approvedMember = await members.findById(user._id).lean();
    assert.equal(approvedMember.memberType, "SELLER");
    assert.equal(approvedMember.memberNick, userInput.memberNick);
    assert.equal(await connection.model("SmsJob").countDocuments(), 1);
    assert.equal(
      (await connection.model("SmsJob").findOne().lean()).status,
      "DISABLED",
    );
    assert.equal((await connection.model("SmsJob").findOne().lean()).phone, "+821012345678");
    assert.equal(
      (await ok(inbox, {}, user.accessToken)).getMyNotifications.list.filter(
        (n) => n.notificationTitle === "Seller application approved",
      ).length,
      1,
    );
    // Old tokens consult current DB role; no re-registration or token forgery required.
    const product =
      "mutation($input:ProductInput!){createProduct(input:$input){_id}}";
    const productInput = {
      productType: "RING",
      productTitle: "Test product",
      productPrice: 100,
      productImages: ["uploads/test.jpg"],
    };
    assert.ok(
      (await gql(product, { input: productInput }, other.accessToken)).errors,
    );
    await ok(product, { input: productInput }, user.accessToken);
    const adminUpdate =
      "mutation($input:MemberUpdate!){updateMembersByAdmin(input:$input){_id}}";
    assert.ok(
      (
        await gql(
          adminUpdate,
          { input: { _id: String(adminDoc._id), memberStatus: "BLOCK" } },
          admin.accessToken,
        )
      ).errors,
    );
    assert.ok(
      (
        await gql(
          adminUpdate,
          { input: { _id: other._id, memberType: "SELLER" } },
          admin.accessToken,
        )
      ).errors,
    );
    // Reject and resubmit keeps identity, increments revision and rejects stale decisions.
    const otherDoc1 = await (await upload(other.accessToken)).json();
    const otherDoc2 = await (await upload(other.accessToken)).json();
    const otherInput = {
      ...input,
      idDocumentId: otherDoc1.documentId,
      businessDocumentId: otherDoc2.documentId,
    };
    const second = (await ok(submit, { input: otherInput }, other.accessToken))
      .submitSellerApplication;
    await ok(
      review,
      {
        input: {
          applicationId: second._id,
          revision: 1,
          decision: "REJECTED",
          reason: "Please supply a clearer registration document.",
        },
      },
      admin.accessToken,
    );
    const resubmitted = (
      await ok(submit, { input: otherInput }, other.accessToken)
    ).submitSellerApplication;
    assert.equal(resubmitted._id, second._id);
    assert.equal(resubmitted.revision, 2);
    assert.ok(
      (
        await gql(
          review,
          {
            input: {
              applicationId: second._id,
              revision: 1,
              decision: "APPROVED",
            },
          },
          admin.accessToken,
        )
      ).errors,
    );
    // SMS gateway fake: disabled stays disabled; explicit requeue, retry, success, failure.
    let fail = true;
    let receivedKey;
    gateway = http.createServer((req, res) => {
      receivedKey = req.headers["idempotency-key"];
      res.statusCode = fail ? 503 : 202;
      res.end();
    });
    await new Promise((resolve) => gateway.listen(0, "127.0.0.1", resolve));
    process.env.SMS_GATEWAY_URL = `http://127.0.0.1:${gateway.address().port}/sms`;
    process.env.SMS_GATEWAY_TOKEN = "test-only";
    process.env.SMS_ENABLED = "true";
    const { SmsService } = require("../dist/components/governance/sms.service");
    const worker = app.get(SmsService);
    worker.onModuleDestroy();
    await worker.tick();
    assert.equal(
      (await connection.model("SmsJob").findOne().lean()).status,
      "DISABLED",
    );
    assert.equal((await connection.model("SmsJob").findOne().lean()).phone, "+821012345678");
    const job = await connection.model("SmsJob").findOne().lean();
    await ok(
      "mutation($jobId:String!){requeueSmsByAdmin(jobId:$jobId)}",
      { jobId: String(job._id) },
      admin.accessToken,
    );
    await worker.tick();
    assert.equal(
      (await connection.model("SmsJob").findById(job._id).lean()).status,
      "QUEUED",
    );
    fail = false;
    await connection
      .model("SmsJob")
      .updateOne({ _id: job._id }, { $set: { nextAttemptAt: new Date(0) } });
    await worker.tick();
    assert.equal(
      (await connection.model("SmsJob").findById(job._id).lean()).status,
      "SENT",
    );
    assert.equal(receivedKey, job.key);
    fail = true;
    await connection
      .model("SmsJob")
      .create({
        key: "failure-test",
        receiverId: user._id,
        phone: "+998901234567",
        message: "Test",
        status: "QUEUED",
        attempts: 4,
        nextAttemptAt: new Date(0),
      });
    await worker.tick();
    assert.equal(
      (await connection.model("SmsJob").findOne({ key: "failure-test" }).lean())
        .status,
      "FAILED",
    );
    for (const domain of [
      "services",
      "orders",
      "orderItems",
      "bookings",
      "salon",
      "requests",
      "deliveries",
      "reviews",
      "articles",
      "comments",
      "sms",
      "audits",
    ]) {
      await ok(
        "query($domain:String!){getAdminRecords(domain:$domain,input:{page:1,limit:20}){total list{_id data}}}",
        { domain },
        admin.accessToken,
      );
    }
    // Admin workflow validates transitions, audit history is written atomically.
    const bookingId = new mongoose.Types.ObjectId();
    await connection
      .collection("serviceBookings")
      .insertOne({
        _id: bookingId,
        bookingStatus: "REQUESTED",
        slotKey: "test-slot",
      });
    const updateRecord =
      "mutation($input:AdminRecordUpdate!){updateAdminRecord(input:$input){_id}}";
    assert.ok(
      (
        await gql(
          updateRecord,
          {
            input: {
              domain: "bookings",
              id: String(bookingId),
              changes: JSON.stringify({ bookingStatus: "COMPLETED" }),
            },
          },
          admin.accessToken,
        )
      ).errors,
    );
    await ok(
      updateRecord,
      {
        input: {
          domain: "bookings",
          id: String(bookingId),
          changes: JSON.stringify({ bookingStatus: "CANCELLED" }),
        },
      },
      admin.accessToken,
    );
    assert.equal(
      (
        await connection
          .collection("serviceBookings")
          .findOne({ _id: bookingId })
      ).slotKey,
      undefined,
    );
    assert.ok(
      (await connection
        .model("AdminAudit")
        .countDocuments({ adminId: adminDoc._id })) >= 3,
    );
    console.log(
      "PASS: isolated replica-set GraphQL/HTTP tests: user/seller/admin auth, private uploads, size/type/ownership, parallel submit/approve, inbox, role activation, protected admins, reject/resubmit revisions, SMS disabled/retry/success/failure, admin transitions and audits.",
    );
  } finally {
    if (app) await app.close();
    if (gateway) await new Promise((resolve) => gateway.close(resolve));
    await repl.stop();
    fs.rmSync(privateDir, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
