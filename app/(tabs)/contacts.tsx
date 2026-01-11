import { useEffect } from "react";
import { router } from "expo-router";

export default function ContactsTab() {
  useEffect(() => {
    router.replace("/contacts");
  }, []);

  return null;
}
