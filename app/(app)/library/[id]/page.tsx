import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBookById } from "@/lib/books/queries";
import { BookDetails } from "@/components/library/book-details";

interface BookPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
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

  return <BookDetails book={book} />;
}
