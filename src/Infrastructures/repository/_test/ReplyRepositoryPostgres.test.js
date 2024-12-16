const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NewReply = require('../../../Domains/replies/entities/NewReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const pool = require('../../database/postgres/pool');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const ForbiddenError = require('../../../Commons/exceptions/ForbiddenError');

describe('ReplyRepositoryPostgres', () => {
  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply and return added reply correctly', async () => {
      // Arrange
      const userId = 'user-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, thread: threadId, owner: userId });
      const newReply = new NewReply({
        content: 'Reply content submission 1',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await replyRepositoryPostgres.addReply(commentId, userId, newReply);

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
    });

    it('should return added reply correctly', async () => {
      // Arrange
      const userId = 'user-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, thread: threadId, owner: userId });
      const newReply = new NewReply({
        content: 'Reply content submission 1',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(commentId, userId, newReply);

      // Assert
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'Reply content submission 1',
        owner: userId,
      }));
    });
  });

  describe('verifyReplyExistsById', () => {
    it('should throw NotFoundError when reply not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyExistsById('reply-456'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when reply is found', async () => {
      // Arrange
      const userId = 'user-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, thread: threadId, owner: userId });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', comment: commentId, owner: userId });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyExistsById('reply-123'))
        .resolves.not
        .toThrowError(NotFoundError);
    });
  });

  describe('verifyOwnerByUserId', () => {
    it('should throw ForbiddenError when reply owner is not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'user123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'user456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', thread: 'thread-123', owner: 'user-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', comment: 'comment-123', owner: 'user-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-456', comment: 'comment-123', owner: 'user-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyOwnerByUserId('reply-456', 'user-123'))
        .rejects
        .toThrowError(ForbiddenError);
    });

    it('should not throw ForbiddenError when reply owner is match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'user123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'user456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', thread: 'thread-123', owner: 'user-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', comment: 'comment-123', owner: 'user-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-456', comment: 'comment-123', owner: 'user-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyOwnerByUserId('reply-123', 'user-123'))
        .resolves.not
        .toThrowError(ForbiddenError);
    });
  });

  describe('deleteReplyById function', () => {
    it('should delete reply from database', async () => {
      // Arrange
      const userId = 'user-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const replyId = 'reply-123';
      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, thread: threadId, owner: userId });
      await RepliesTableTestHelper.addReply({ id: replyId, comment: commentId, owner: userId });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      await replyRepositoryPostgres.deleteReplyById(replyId);

      // Assert
      const deletedReply = await RepliesTableTestHelper.findDeletedRepliesById(replyId);
      expect(deletedReply).toHaveLength(1);
    });
  });

  describe('getAllReplyByThreadId function', () => {
    it('should return all reply from specific comment', async () => {
      // Arrange
      const firstUserId = 'user-123';
      const firstUsername = 'user123';
      const secondUserId = 'user-456';
      const secondUsername = 'user456';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      await UsersTableTestHelper.addUser({ id: firstUserId, username: firstUsername });
      await UsersTableTestHelper.addUser({ id: secondUserId, username: secondUsername });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: firstUserId });
      await CommentsTableTestHelper.addComment({ id: commentId, thread: threadId, owner: firstUserId });
      const firstReplyId = 'reply-123';
      const firstReplyDate = new Date();
      const secondReplyId = 'reply-456';
      const secondReplyDate = new Date();
      await RepliesTableTestHelper.addReply({ id: firstReplyId, date: firstReplyDate, comment: commentId, owner: firstUserId });
      await RepliesTableTestHelper.addReply({ id: secondReplyId, date: secondReplyDate, comment: commentId, owner: secondUserId });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      const allReply = await replyRepositoryPostgres.getAllReplyByCommentId(commentId);

      // Assert
      expect(allReply).toHaveLength(2);
      // Check first reoly expected value
      expect(allReply[0]).toStrictEqual({
        id: firstReplyId,
        content: 'Reply content',
        date: firstReplyDate,
        comment: commentId,
        owner: firstUserId,
        // eslint-disable-next-line camelcase
        is_delete: null,
        username: firstUsername,
      });
      // Check second reoly expected value
      expect(allReply[1]).toStrictEqual({
        id: secondReplyId,
        content: 'Reply content',
        date: firstReplyDate,
        comment: commentId,
        owner: secondUserId,
        // eslint-disable-next-line camelcase
        is_delete: null,
        username: secondUsername,
      });
      // Check if reply ascending
      expect(allReply[0].date.getTime()).toBeLessThanOrEqual(allReply[1].date.getTime());
    });
  });
});
