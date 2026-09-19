import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBookById } from "@/lib/books/queries";
import { PageHeader } from "@/components/layout/page-header";
import { BookForm } from "@/components/library/book-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EditBookPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const book = await getBookById(supabase, user.id, id);

  if (!book) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href={`/library/${book.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Book Details</span>
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Edit "${book.title}"`}
        description={`Code: ${book.book_code} • Update metadata, change cover, or adjust quantity.`}
      />

      <BookForm mode="edit" initialBook={book} />
    </div>
  );
}
