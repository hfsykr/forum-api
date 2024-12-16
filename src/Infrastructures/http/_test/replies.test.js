const pool = require('../../database/postgres/pool');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');
const AuthenticationTokenManager = require('../../../Applications/security/AuthenticationTokenManager');

describe('Replies endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('/threads/{threadId}/comments/{commentId}/replies endpoint', () => {
    describe('when hit with unauthorized request', () => {
      it('should response 401', async () => {
        // Arrange
        const threadId = 'thread-123';
        const commentId = 'comment-123';
        const requestPayload = {
          content: 'Comment content submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments/${commentId}/replies`,
          payload: requestPayload,
        });

        // Assert
        expect(response.statusCode).toEqual(401);
      });
    });

    describe('when hit with authorized request', () => {
      let decodedPayload;
      let threadId;
      let commentId;

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
        threadId = threadResponseJson.data.addedThread.id;
        // add comment
        const commentResponse = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments`,
          payload: {
            content: 'Comment content submission 1',
          },
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });
        const commentResponseJson = JSON.parse(commentResponse.payload);
        commentId = commentResponseJson.data.addedComment.id;
      });

      it('should response 201 and persisted reply', async () => {
        // Arrange
        const requestPayload = {
          content: 'Reply content submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments/${commentId}/replies`,
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
        expect(responseJson.data.addedReply).toBeDefined();
      });

      it('should response 404 when thread not found', async () => {
        // Arrange
        const requestPayload = {
          content: 'Reply content submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: `/threads/thread-456/comments/${commentId}/replies`,
          payload: requestPayload,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(404);
        expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual('thread tidak ditemukan');
      });

      it('should response 404 when comment not found', async () => {
        // Arrange
        const requestPayload = {
          content: 'Reply content submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments/comment-456/replies`,
          payload: requestPayload,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(404);
        expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual('comment tidak ditemukan');
      });

      it('should response 400 when request payload not contain needed property', async () => {
        // Arrange
        const requestPayload = {
          title: 'Reply content submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments/${commentId}/replies`,
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
        expect(responseJson.message).toEqual('tidak dapat membuat reply baru karena properti yang dibutuhkan tidak ada');
      });

      it('should response 400 when request payload not meet data type specification', async () => {
        // Arrange
        const requestPayload = {
          content: 123,
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments/${commentId}/replies`,
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
        expect(responseJson.message).toEqual('tidak dapat membuat reply baru karena tipe data tidak sesuai');
      });
    });
  });

  describe('/threads/{threadId}/comments/{commentId}/replies/{replyId} endpoint', () => {
    describe('when hit with unauthorized request', () => {
      it('should response 401', async () => {
        // Arrange
        const threadId = 'thread-123';
        const commentId = 'comment-123';
        const replyId = 'reply-123';
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
        });

        // Assert
        expect(response.statusCode).toEqual(401);
      });
    });

    describe('when hit with authorized request', () => {
      let decodedPayload;
      let threadId;
      let commentId;
      let replyId;

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
        threadId = threadResponseJson.data.addedThread.id;
        // add comment
        const commentResponse = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments`,
          payload: {
            content: 'Comment content submission 1',
          },
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });
        const commentResponseJson = JSON.parse(commentResponse.payload);
        commentId = commentResponseJson.data.addedComment.id;
        // add reply
        const replyResponse = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments/${commentId}/replies`,
          payload: {
            content: 'Reply content submission 1',
          },
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });
        const replyResponseJson = JSON.parse(replyResponse.payload);
        replyId = replyResponseJson.data.addedReply.id;
      });

      it('should response 200 and delete reply', async () => {
        // Arrange
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(200);
        expect(responseJson.status).toEqual('success');
        const deletedReply = await RepliesTableTestHelper.findDeletedRepliesById(replyId);
        expect(deletedReply).toHaveLength(1);
      });

      it('should response 403 when user not the reply owner', async () => {
        // Arrange
        await UsersTableTestHelper.addUser({ id: 'user-456', username: 'user456' });
        await RepliesTableTestHelper.addReply({ id: 'reply-456', comment: commentId, owner: 'user-456' });
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/${threadId}/comments/${commentId}/replies/reply-456`,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(403);
        expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual('tidak memiliki hak untuk mengakses reply');
      });

      it('should response 404 when thread not found', async () => {
        // Arrange
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/thread-456/comments/${commentId}/replies/${replyId}`,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(404);
        expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual('thread tidak ditemukan');
      });

      it('should response 404 when comment not found', async () => {
        // Arrange
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/${threadId}/comments/comment-456/replies/${replyId}`,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(404);
        expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual('comment tidak ditemukan');
      });

      it('should response 404 when reply not found', async () => {
        // Arrange
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/${threadId}/comments/${commentId}/replies/reply-456`,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(404);
        expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual('reply tidak ditemukan');
      });
    });
  });
});
