const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const DeleteCommentUseCase = require('../DeleteCommentUseCase');

describe('DeleteCommentUseCase', () => {
  it('should orchestrating the delete comment action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    const userId = 'user-123';
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    mockThreadRepository.verifyThreadExistsById = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExistsById = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyOwnerByUserId = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.deleteCommentById = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    await deleteCommentUseCase.execute(threadId, commentId, userId);

    // Assert
    expect(mockThreadRepository.verifyThreadExistsById)
      .toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.verifyCommentExistsById)
      .toHaveBeenCalledWith(commentId);
    expect(mockCommentRepository.verifyOwnerByUserId)
      .toHaveBeenCalledWith(commentId, userId);
    expect(mockCommentRepository.deleteCommentById)
      .toHaveBeenCalledWith(commentId);
  });
});
