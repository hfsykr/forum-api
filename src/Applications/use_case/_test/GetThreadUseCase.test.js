const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const GetThreadUseCase = require('../GetThreadUseCase');

describe('GetThreadUseCase', () => {
  /**
   * Menguji apakah use case mampu mengoskestrasikan langkah demi langkah dengan benar.
   */
  it('should orchestrating get thread action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';

    const expectedThread = {
      id: threadId,
      title: 'Thread title submission 1',
      body: 'Thread body submission 1',
      date: '2024-12-09T07:35:32.691Z',
      username: 'user123',
      comments: [
        {
          id: 'comment-123',
          username: 'user123',
          date: '2024-12-09T07:35:48.445Z',
          replies: [
            {
              id: 'reply-123',
              content: '**balasan telah dihapus**',
              date: '2024-12-09T07:45:00.587Z',
              username: 'user456',
            },
            {
              id: 'reply-456',
              content: 'Reply 2 content submission 1',
              date: '2024-12-09T07:50:00.587Z',
              username: 'user123',
            },
          ],
          content: 'Comment 1 content submission 1',
        },
        {
          id: 'comment-456',
          username: 'user456',
          date: '2024-12-09T07:38:00.587Z',
          replies: [],
          content: '**komentar telah dihapus**',
        },
      ],
    };

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    /** mocking needed function */
    mockThreadRepository.verifyThreadExistsById = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve(
        {
          id: threadId,
          username: 'user123',
          title: 'Thread title submission 1',
          body: 'Thread body submission 1',
          date: '2024-12-09T07:35:32.691Z',
          owner: 'user-123',
        },
      ));
    mockCommentRepository.getAllCommentByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve(
        [
          {
            id: 'comment-123',
            content: 'Comment 1 content submission 1',
            date: '2024-12-09T07:35:48.445Z',
            thread: threadId,
            owner: 'user-456',
            // eslint-disable-next-line camelcase
            is_delete: false,
            username: 'user123',
          },
          {
            id: 'comment-456',
            content: 'Comment 2 content submission 1',
            date: '2024-12-09T07:38:00.587Z',
            thread: threadId,
            owner: 'user-789',
            // eslint-disable-next-line camelcase
            is_delete: true,
            username: 'user456',
          },
        ],
      ));
    mockReplyRepository.getAllReplyByCommentId = jest.fn()
      .mockImplementationOnce(() => Promise.resolve(
        [
          {
            id: 'reply-123',
            content: 'Reply 1 content submission 1',
            date: '2024-12-09T07:45:00.587Z',
            comment: 'comment-123',
            owner: 'user-456',
            // eslint-disable-next-line camelcase
            is_delete: true,
            username: 'user456',
          },
          {
            id: 'reply-456',
            content: 'Reply 2 content submission 1',
            date: '2024-12-09T07:50:00.587Z',
            comment: 'comment-123',
            owner: 'user-123',
            // eslint-disable-next-line camelcase
            is_delete: false,
            username: 'user123',
          },
        ],
      ))
      .mockImplementationOnce(() => Promise.resolve([]));

    /** creating use case instance */
    const getThreadUseCase = new GetThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const thread = await getThreadUseCase.execute(threadId);

    // Assert
    expect(thread).toStrictEqual(expectedThread);
    expect(mockThreadRepository.verifyThreadExistsById).toBeCalledWith(threadId);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getAllCommentByThreadId).toBeCalledWith(threadId);
    expect(mockReplyRepository.getAllReplyByCommentId).toBeCalledTimes(2);
  });
});
