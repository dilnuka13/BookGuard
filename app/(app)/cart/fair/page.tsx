import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookFairMode } from "@/components/cart/book-fair-mode";
import { getCartItems } from "@/lib/cart/queries";

export const metadata = {
  title: "Book Fair Mode | BookGuard",
  description: "Distraction-free personal buying planner for book fairs and bookstores.",
};

export default async function BookFairPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const items = await getCartItems(supabase, user.id);

  return <BookFairMode initialItems={items} userId={user.id} />;
}
