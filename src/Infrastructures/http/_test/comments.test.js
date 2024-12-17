const pool = require('../../database/postgres/pool');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');
const AuthenticationTokenManager = require('../../../Applications/security/AuthenticationTokenManager');

describe('Comments endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('/threads/{threadId}/comments endpoint', () => {
    describe('when hit with unauthorized request', () => {
      it('should response 401', async () => {
        // Arrange
        const threadId = 'thread-123';
        const requestPayload = {
          content: 'Comment content submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments`,
          payload: requestPayload,
        });

        // Assert
        expect(response.statusCode).toEqual(401);
      });
    });

    describe('when hit with authorized request', () => {
      let decodedPayload;
      let threadId;

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
      });

      it('should response 201 and persisted comment', async () => {
        // Arrange
        const requestPayload = {
          content: 'Comment content submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments`,
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
        expect(responseJson.data.addedComment).toBeDefined();
      });

      it('should response 404 when thread not found', async () => {
        // Arrange
        const requestPayload = {
          content: 'Comment content submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: '/threads/thread-456/comments',
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

      it('should response 400 when request payload not contain needed property', async () => {
        // Arrange
        const requestPayload = {
          title: 'Comment content submission 1',
        };
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments`,
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
        expect(responseJson.message).toEqual('tidak dapat membuat comment baru karena properti yang dibutuhkan tidak ada');
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
          url: `/threads/${threadId}/comments`,
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
        expect(responseJson.message).toEqual('tidak dapat membuat comment baru karena tipe data tidak sesuai');
      });
    });
  });

  describe('/threads/{threadId}/comments/{commentId} endpoint', () => {
    describe('when hit with unauthorized request', () => {
      it('should response 401', async () => {
        // Arrange
        const threadId = 'thread-123';
        const commentId = 'comment-123';
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/${threadId}/comments/${commentId}`,
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

      it('should response 200 and delete comment', async () => {
        // Arrange
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/${threadId}/comments/${commentId}`,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(200);
        expect(responseJson.status).toEqual('success');
        const deletedComment = await CommentsTableTestHelper.findDeletedCommentsById(commentId);
        expect(deletedComment).toHaveLength(1);
      });

      it('should response 403 when user not the comment owner', async () => {
        // Arrange
        await UsersTableTestHelper.addUser({ id: 'user-456', username: 'user456' });
        await CommentsTableTestHelper.addComment({ id: 'comment-456', thread: threadId, owner: 'user-456' });
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/${threadId}/comments/comment-456`,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(403);
        expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual('tidak memiliki hak untuk mengakses comment');
      });

      it('should response 404 when thread not found', async () => {
        // Arrange
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/thread-456/comments/${commentId}`,
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
          url: `/threads/${threadId}/comments/comment-456`,
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
    });
  });

  describe('/threads/{threadId}/comments/{commentId}/likes endpoint', () => {
    describe('when hit with unauthorized request', () => {
      it('should response 401', async () => {
        // Arrange
        const threadId = 'thread-123';
        const commentId = 'comment-123';
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'PUT',
          url: `/threads/${threadId}/comments/${commentId}/likes`,
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

      it('should response 200 and success like', async () => {
        // Arrange
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'PUT',
          url: `/threads/${threadId}/comments/${commentId}/likes`,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(200);
        expect(responseJson.status).toEqual('success');
        const commentsLikes = await CommentsTableTestHelper.findCommentsLikes(commentId, decodedPayload.id);
        expect(commentsLikes).toHaveLength(1);
      });

      it('should response 200 and success unlike when hit 2 times', async () => {
        // Arrange
        const server = await createServer(container);

        // Action
        // Like
        await server.inject({
          method: 'PUT',
          url: `/threads/${threadId}/comments/${commentId}/likes`,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });
        // Unlike
        const response = await server.inject({
          method: 'PUT',
          url: `/threads/${threadId}/comments/${commentId}/likes`,
          auth: {
            strategy: 'forum_api_jwt',
            credentials: { id: decodedPayload.id },
          },
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(200);
        expect(responseJson.status).toEqual('success');
        const commentsLikes = await CommentsTableTestHelper.findCommentsLikes(commentId, decodedPayload.id);
        expect(commentsLikes).toHaveLength(0);
      });

      it('should response 404 when thread not found', async () => {
        // Arrange
        const server = await createServer(container);

        // Action
        const response = await server.inject({
          method: 'PUT',
          url: `/threads/thread-456/comments/${commentId}/likes`,
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
          method: 'PUT',
          url: `/threads/${threadId}/comments/comment-456/likes`,
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
    });
  });
});
