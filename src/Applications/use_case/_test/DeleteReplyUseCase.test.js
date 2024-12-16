const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const DeleteReplyUseCase = require('../DeleteReplyUseCase');

describe('DeleteReplyUseCase', () => {
  it('should orchestrating the delete reply action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    const replyId = 'reply-123';
    const userId = 'user-123';
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();
    mockThreadRepository.verifyThreadExistsById = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExistsById = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyExistsById = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyOwnerByUserId = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.deleteReplyById = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    await deleteReplyUseCase.execute(threadId, commentId, replyId, userId);

    // Assert
    expect(mockThreadRepository.verifyThreadExistsById)
      .toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.verifyCommentExistsById)
      .toHaveBeenCalledWith(commentId);
    expect(mockReplyRepository.verifyReplyExistsById)
      .toHaveBeenCalledWith(replyId);
    expect(mockReplyRepository.verifyOwnerByUserId)
      .toHaveBeenCalledWith(replyId, userId);
    expect(mockReplyRepository.deleteReplyById)
      .toHaveBeenCalledWith(replyId);
  });
});
