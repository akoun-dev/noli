import { useState } from "react";
import { Star, ThumbsUp, MessageSquare, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CustomerReview {
  id: number;
  customerName: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  response?: string | null;
}

interface CustomerReviewsProps {
  reviews: CustomerReview[];
  insurerName: string;
}

const CustomerReviews = ({ reviews, insurerName }: CustomerReviewsProps) => {
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<number, number>>({});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-4 h-4",
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        )}
      />
    ));
  };

  const handleHelpful = (reviewId: number) => {
    setHelpfulVotes(prev => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const totalReviews = reviews.length;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span>Avis clients ({totalReviews})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {renderStars(Math.round(averageRating))}
              <span className="font-semibold ml-2">{averageRating.toFixed(1)}</span>
            </div>
            <Badge variant="outline">{totalReviews} avis</Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rating Summary */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}/5</div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-green-600">{totalReviews}</div>
              <div className="text-sm text-muted-foreground">avis vérifiés</div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-border rounded-lg p-4">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>
                      {getInitials(review.customerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{review.customerName}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(review.date)}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Signaler l'avis</DropdownMenuItem>
                    <DropdownMenuItem>Partager l'avis</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <p className={cn(
                  "text-sm leading-relaxed",
                  expandedReview === review.id ? "" : "line-clamp-3"
                )}>
                  {review.comment}
                </p>
                {review.comment.length > 150 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs"
                    onClick={() => setExpandedReview(
                      expandedReview === review.id ? null : review.id
                    )}
                  >
                    {expandedReview === review.id ? "Voir moins" : "Voir plus"}
                  </Button>
                )}
              </div>

              {/* Review Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpful(review.id)}
                  className="text-xs"
                >
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  Utile ({(helpfulVotes[review.id] || 0) + review.helpful})
                </Button>
                <Badge variant="outline" className="text-xs">
                  Avis vérifié
                </Badge>
              </div>

              {/* Company Response */}
              {review.response && (
                <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{insurerName[0]}</span>
                    </div>
                    <span className="text-sm font-medium text-blue-900">
                      Réponse de {insurerName}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800">{review.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show More Reviews */}
        {reviews.length > 3 && (
          <div className="text-center pt-4 border-t">
            <Button variant="outline" size="sm">
              Voir tous les avis ({reviews.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerReviews;