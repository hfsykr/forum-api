const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const ForbiddenError = require('../../../Commons/exceptions/ForbiddenError');

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment and return added comment correctly', async () => {
      // Arrange
      const userId = 'user-123';
      const threadId = 'thread-123';
      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      const newComment = new NewComment({
        content: 'Comment content submission 1',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await commentRepositoryPostgres.addComment(threadId, userId, newComment);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
    });

    it('should return added comment correctly', async () => {
      // Arrange
      const userId = 'user-123';
      const threadId = 'thread-123';
      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      const newComment = new NewComment({
        content: 'Comment content submission 1',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(threadId, userId, newComment);

      // Assert
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'Comment content submission 1',
        owner: userId,
      }));
    });
  });

  describe('verifyCommentExistsById', () => {
    it('should throw NotFoundError when comment not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentExistsById('comment-456'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when comment is found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', thread: 'thread-123', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentExistsById('comment-123'))
        .resolves.not
        .toThrowError(NotFoundError);
    });
  });

  describe('verifyOwnerByUserId', () => {
    it('should throw ForbiddenError when comment owner is not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'user123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'user456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', thread: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-456', thread: 'thread-123', owner: 'user-456' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyOwnerByUserId('comment-456', 'user-123'))
        .rejects
        .toThrowError(ForbiddenError);
    });

    it('should not throw ForbiddenError when comment owner is match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'user123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'user456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', thread: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-456', thread: 'thread-123', owner: 'user-456' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyOwnerByUserId('comment-123', 'user-123'))
        .resolves.not
        .toThrowError(ForbiddenError);
    });
  });

  describe('deleteCommentById function', () => {
    it('should delete comment from database', async () => {
      // Arrange
      const userId = 'user-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, thread: threadId, owner: userId });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      await commentRepositoryPostgres.deleteCommentById(commentId);

      // Assert
      const deletedComment = await CommentsTableTestHelper.findDeletedCommentsById(commentId);
      expect(deletedComment).toHaveLength(1);
    });
  });

  describe('getAllCommentByThreadId function', () => {
    it('should return all comment from specific thread', async () => {
      // Arrange
      const firstUserId = 'user-123';
      const firstUsername = 'user123';
      const secondUserId = 'user-456';
      const secondUsername = 'user456';
      const threadId = 'thread-123';
      await UsersTableTestHelper.addUser({ id: firstUserId, username: firstUsername });
      await UsersTableTestHelper.addUser({ id: secondUserId, username: secondUsername });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: firstUserId });
      const firstCommentId = 'comment-123';
      const firstCommentDate = new Date();
      const secondCommentId = 'comment-456';
      const secondCommentDate = new Date();
      await CommentsTableTestHelper.addComment({ id: firstCommentId, date: firstCommentDate, thread: threadId, owner: firstUserId });
      await CommentsTableTestHelper.addComment({ id: secondCommentId, date: secondCommentDate, thread: threadId, owner: secondUserId });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const allComment = await commentRepositoryPostgres.getAllCommentByThreadId(threadId);

      // Assert
      expect(allComment).toHaveLength(2);
      // Check first comment expected value
      expect(allComment[0]).toStrictEqual({
        id: firstCommentId,
        content: 'Comment content',
        date: firstCommentDate,
        thread: threadId,
        owner: firstUserId,
        // eslint-disable-next-line camelcase
        is_delete: null,
        username: firstUsername,
      });
      // Check second comment expected value
      expect(allComment[1]).toStrictEqual({
        id: secondCommentId,
        content: 'Comment content',
        date: firstCommentDate,
        thread: threadId,
        owner: secondUserId,
        // eslint-disable-next-line camelcase
        is_delete: null,
        username: secondUsername,
      });
      // Check if comment ascending
      expect(allComment[0].date.getTime()).toBeLessThanOrEqual(allComment[1].date.getTime());
    });
  });
});
