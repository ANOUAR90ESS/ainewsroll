import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Trash2, Edit, X } from 'lucide-react';
import { Tool, ToolReview, ToolRatingSummary, UserProfile } from '../types';
import StarRating from './StarRating';
import {
  getToolReviews,
  getToolRatingSummary,
  addReview,
  updateReview,
  deleteReview,
  getUserReviewForTool
} from '../services/reviewsService';

interface ToolReviewsProps {
  tool: Tool;
  user: UserProfile | null;
  onLoginRequired: () => void;
}

const ToolReviews: React.FC<ToolReviewsProps> = ({ tool, user, onLoginRequired }) => {
  const [reviews, setReviews] = useState<ToolReview[]>([]);
  const [summary, setSummary] = useState<ToolRatingSummary | null>(null);
  const [userReview, setUserReview] = useState<ToolReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [tool.id, user]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [reviewsData, summaryData] = await Promise.all([
        getToolReviews(tool.id),
        getToolRatingSummary(tool.id)
      ]);

      setReviews(reviewsData);
      setSummary(summaryData);

      // Load user's review if logged in
      if (user) {
        const userRev = await getUserReviewForTool(user.id, tool.id);
        setUserReview(userRev);
        if (userRev) {
          setRating(userRev.rating);
          setTitle(userRev.title || '');
          setComment(userRev.comment || '');
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      onLoginRequired();
      return;
    }

    try {
      setSubmitting(true);

      if (userReview) {
        // Update existing review
        await updateReview(userReview.id, rating, title, comment);
      } else {
        // Add new review
        await addReview(user.id, tool.id, rating, title, comment);
      }

      // Reset form
      setEditing(false);
      await loadReviews();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userReview || !confirm('Are you sure you want to delete your review?')) return;

    try {
      setSubmitting(true);
      await deleteReview(userReview.id);
      setUserReview(null);
      setRating(5);
      setTitle('');
      setComment('');
      setEditing(false);
      await loadReviews();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      alert(error.message || 'Failed to delete review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      {summary && summary.review_count > 0 && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
          <div className="flex items-start gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">{summary.average_rating.toFixed(1)}</div>
              <StarRating rating={summary.average_rating} size="lg" readonly />
              <p className="text-zinc-400 text-sm mt-2">{summary.review_count} reviews</p>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary[`${['one', 'two', 'three', 'four', 'five'][stars - 1]}_star_count` as keyof ToolRatingSummary] as number;
                const percentage = summary.review_count > 0 ? (count / summary.review_count) * 100 : 0;

                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400 w-8">{stars} ⭐</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-zinc-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Write/Edit Review Form */}
      {user && (!userReview || editing) && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              {userReview ? 'Edit Your Review' : 'Write a Review'}
            </h3>
            {editing && (
              <button
                onClick={() => setEditing(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Rating</label>
              <StarRating rating={rating} onChange={setRating} size="lg" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sum up your experience"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this tool..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                maxLength={1000}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
              </button>

              {userReview && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="bg-red-900/20 hover:bg-red-900/40 text-red-400 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* User's existing review (not editing) */}
      {user && userReview && !editing && (
        <div className="bg-indigo-900/10 rounded-xl border border-indigo-800/50 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StarRating rating={userReview.rating} size="md" readonly />
                <span className="text-xs text-zinc-500">{formatDate(userReview.created_at)}</span>
              </div>
              {userReview.title && <h4 className="font-bold text-white mb-2">{userReview.title}</h4>}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          {userReview.comment && <p className="text-zinc-300">{userReview.comment}</p>}
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">
            All Reviews ({reviews.length})
          </h3>

          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={review.rating} size="md" readonly />
                    <span className="text-sm text-zinc-400">{review.user_email}</span>
                    <span className="text-xs text-zinc-500">{formatDate(review.created_at)}</span>
                  </div>
                  {review.title && <h4 className="font-bold text-white mb-2">{review.title}</h4>}
                </div>
              </div>
              {review.comment && <p className="text-zinc-300">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {/* No reviews yet */}
      {reviews.length === 0 && !user && (
        <div className="text-center py-12 text-zinc-500">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No reviews yet. Be the first to review this tool!</p>
          <button
            onClick={onLoginRequired}
            className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Sign in to write a review
          </button>
        </div>
      )}
    </div>
  );
};

export default ToolReviews;
