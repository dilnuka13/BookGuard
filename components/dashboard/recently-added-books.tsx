import Link from "next/link";
import { BookCover } from "@/components/library/book-cover";
import { Button } from "@/components/ui/button";
import type { LibraryItem } from "@/types/library";
import { ArrowRight, Plus, BookOpen } from "lucide-react";

interface RecentlyAddedBooksProps {
  books: LibraryItem[];
}

export function RecentlyAddedBooks({ books }: RecentlyAddedBooksProps) {
  if (books.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h4 className="text-sm font-bold text-foreground">
            No Books in Your Library Yet
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Start adding books to your personal shelf so BookGuard can protect you against duplicate purchases.
          </p>
        </div>
        <div className="pt-2">
          <Button asChild variant="brandGradient" size="sm" className="rounded-xl">
            <Link href="/library/add" className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Your First Book</span>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Recently Added to Shelf
          </h3>
          <p className="text-xs text-muted-foreground">
            Latest additions to your personal library
          </p>
        </div>

        <Button asChild variant="ghost" size="sm" className="text-xs text-primary gap-1">
          <Link href="/library">
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/library/${book.id}`}
            className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-2.5 transition-all hover:border-border/80 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="mx-auto w-full flex justify-center">
              <BookCover
                url={book.cover_url}
                title={book.title}
                author={book.author}
                size="md"
                className="w-full max-w-[130px]"
              />
            </div>

            <div className="space-y-0.5 text-left">
              <h4 className="line-clamp-1 text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                {book.title}
              </h4>
              {book.author && (
                <p className="line-clamp-1 text-[10px] text-muted-foreground">
                  {book.author}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
