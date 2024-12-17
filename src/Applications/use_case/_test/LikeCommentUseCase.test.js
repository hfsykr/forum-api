const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const LikeCommentUseCase = require('../LikeCommentUseCase');

describe('LikeCommentUseCase', () => {
  /**
   * Menguji apakah use case mampu mengoskestrasikan langkah demi langkah dengan benar.
   */
  it('should orchestrating the like comment action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    const userId = 'user-123';

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    /** mocking needed function */
    mockThreadRepository.verifyThreadExistsById = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExistsById = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyUserHasLikeComment = jest.fn()
      .mockImplementationOnce(() => Promise.resolve(false))
      .mockImplementationOnce(() => Promise.resolve(true));
    mockCommentRepository.addCommentLike = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.deleteCommentLike = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.increaseLikeCountByCommentId = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.decreaseLikeCountByCommentId = jest.fn()
      .mockImplementation(() => Promise.resolve());

    /** creating use case instance */
    const likeCommentUseCase = new LikeCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    // Like
    await likeCommentUseCase.execute(threadId, commentId, userId);
    // Like again (Unlike)
    await likeCommentUseCase.execute(threadId, commentId, userId);


    // Assert
    expect(mockThreadRepository.verifyThreadExistsById).toBeCalledWith(threadId);
    expect(mockCommentRepository.verifyCommentExistsById).toBeCalledWith(commentId);
    expect(mockCommentRepository.verifyUserHasLikeComment).toBeCalledWith(commentId, userId);
    expect(mockCommentRepository.verifyUserHasLikeComment).toBeCalledTimes(2);
    expect(mockCommentRepository.addCommentLike).toBeCalledWith(commentId, userId);
    expect(mockCommentRepository.increaseLikeCountByCommentId).toBeCalledWith(commentId);
    expect(mockCommentRepository.deleteCommentLike).toBeCalledWith(commentId, userId);
    expect(mockCommentRepository.decreaseLikeCountByCommentId).toBeCalledWith(commentId);
  });
});
