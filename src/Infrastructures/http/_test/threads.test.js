const pool = require('../../database/postgres/pool');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');
const AuthenticationTokenManager = require('../../../Applications/security/AuthenticationTokenManager');

describe('Threads endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('/threads endpoint', () => {
    describe('when hit with unauthorized request', () => {
      it('should response 401', async () => {
        // Arrange
        const requestPayload = {
          title: 'Thread title submission 1',
          body: 'Thread body submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: '/threads',
          payload: requestPayload,
        });

        // Assert
        expect(response.statusCode).toEqual(401);
      });
    });

    describe('when hit with authorized request', () => {
      let decodedPayload;

      beforeEach(async () => {
        const server = await createServer(container);
        // add user
        await server.inject({
          method: 'POST',
          url: '/users',
          payload: {
            username: 'dicoding',
            password: 'secret',
            fullname: 'Dicoding Indonesia',
          },
        });
        // login user
        const loginResponse = await server.inject({
          method: 'POST',
          url: '/authentications',
          payload: {
            username: 'dicoding',
            password: 'secret',
          },
        });
        const loginResponseJson = JSON.parse(loginResponse.payload);
        const accessToken = loginResponseJson.data.accessToken;
        decodedPayload = await container.getInstance(AuthenticationTokenManager.name)
          .decodePayload(accessToken);
      });

      it('should response 201 and persisted thread', async () => {
        // Arrange
        const requestPayload = {
          title: 'Thread title submission 1',
          body: 'Thread body submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: '/threads',
          payload: requestPayload,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(201);
        expect(responseJson.status).toEqual('success');
        expect(responseJson.data.addedThread).toBeDefined();
      });

      it('should response 400 when request payload not contain needed property', async () => {
        // Arrange
        const requestPayload = {
          body: 'Body threads submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: '/threads',
          payload: requestPayload,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(400);
        expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada');
      });

      it('should response 400 when request payload not meet data type specification', async () => {
        // Arrange
        const requestPayload = {
          title: true,
          body: 123,
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: '/threads',
          payload: requestPayload,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(400);
        expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena tipe data tidak sesuai');
      });
    });
  });

  describe('/threads/{threadId} endpoint', () => {
    it('should response 200 and not need auth', async () => {
      // Arrange
      const server = await createServer(container);
      // add user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'dicoding',
          password: 'secret',
          fullname: 'Dicoding Indonesia',
        },
      });
      // login user
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });
      const loginResponseJson = JSON.parse(loginResponse.payload);
      const accessToken = loginResponseJson.data.accessToken;
      const decodedPayload = await container.getInstance(AuthenticationTokenManager.name)
        .decodePayload(accessToken);
      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Thread title submission 1',
          body: 'Thread body submission 1',
        },
        auth: {
          strategy: 'forum_api_jwt',
          credentials: { id: decodedPayload.id },
        },
      });
      const threadResponseJson = JSON.parse(threadResponse.payload);
      const threadId = threadResponseJson.data.addedThread.id;
      // Add comment 1
      const firstCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'Comment 1 content submission 1',
        },
        auth: {
          strategy: 'forum_api_jwt',
          credentials: { id: decodedPayload.id },
        },
      });
      // Add comment 2
      const secondCommentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'Comment 2 content submission 1',
        },
        auth: {
          strategy: 'forum_api_jwt',
          credentials: { id: decodedPayload.id },
        },
      });
      const firstCommentResponseJson = JSON.parse(firstCommentResponse.payload);
      const secondCommentResponseJson = JSON.parse(secondCommentResponse.payload);
      const firstCommentId = firstCommentResponseJson.data.addedComment.id;
      const secondCommentId = secondCommentResponseJson.data.addedComment.id;
      // Delete comment 2
      await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${secondCommentId}`,
        auth: {
          strategy: 'forum_api_jwt',
          credentials: { id: decodedPayload.id },
        },
      });
      // Like comment 1
      await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${firstCommentId}/likes`,
        auth: {
          strategy: 'forum_api_jwt',
          credentials: { id: decodedPayload.id },
        },
      });
      // Add reply 1
      const replyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${firstCommentId}/replies`,
        payload: {
          content: 'Reply 1 content submission 1',
        },
        auth: {
          strategy: 'forum_api_jwt',
          credentials: { id: decodedPayload.id },
        },
      });
      // Add reply 2
      await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${firstCommentId}/replies`,
        payload: {
          content: 'Reply 2 content submission 1',
        },
        auth: {
          strategy: 'forum_api_jwt',
          credentials: { id: decodedPayload.id },
        },
      });
      const replyResponseJson = JSON.parse(replyResponse.payload);
      const replyId = replyResponseJson.data.addedReply.id;
      // Delete reply 1
      await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${firstCommentId}/replies/${replyId}`,
        auth: {
          strategy: 'forum_api_jwt',
          credentials: { id: decodedPayload.id },
        },
      });

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.data.thread).toBeDefined();
      expect(responseJson.data.thread.comments).toBeDefined();
      // Check all comment
      expect(responseJson.data.thread.comments).toHaveLength(2);
      // Check comment deleted
      expect(responseJson.data.thread.comments[1].content).toEqual('**komentar telah dihapus**');
      // Check comment ascending
      const firstCommentDate = new Date(responseJson.data.thread.comments[0].date);
      const secondCommentDate = new Date(responseJson.data.thread.comments[1].date);
      expect(firstCommentDate.getTime()).toBeLessThanOrEqual(secondCommentDate.getTime());
      // Check comment like
      expect(responseJson.data.thread.comments[0].likeCount).toEqual(1);
      // Check comment like
      expect(responseJson.data.thread.comments[1].likeCount).toEqual(0);
      // Check all reply
      expect(responseJson.data.thread.comments[0].replies).toHaveLength(2);
      // Check reply deleted
      expect(responseJson.data.thread.comments[0].replies[0].content).toEqual('**balasan telah dihapus**');
      // Check reply ascending
      const firstReplyDate = new Date(responseJson.data.thread.comments[0].replies[0].date);
      const secondReplyDate = new Date(responseJson.data.thread.comments[0].replies[0].date);
      expect(firstReplyDate.getTime()).toBeLessThanOrEqual(secondReplyDate.getTime());
    });
  });
});
