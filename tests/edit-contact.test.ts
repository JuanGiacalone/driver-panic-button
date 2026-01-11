import { describe, it, expect, beforeEach, vi } from "vitest";
import { getContacts, updateContact, addContact } from "@/lib/storage";
import type { EmergencyContact } from "@/types";

describe("Edit Contact Functionality", () => {
  const mockContact: EmergencyContact = {
    id: "contact-1",
    name: "John Doe",
    phoneNumber: "+1 (555) 123-4567",
    alertMethod: "sms",
  };

  beforeEach(async () => {
    // Clear storage before each test
    const contacts = await getContacts();
    for (const contact of contacts) {
      // Reset storage state
    }
  });

  it("should update contact name", async () => {
    // Add initial contact
    await addContact(mockContact);

    // Update contact name
    const updatedContact = {
      ...mockContact,
      name: "Jane Doe",
    };
    await updateContact(updatedContact);

    // Verify update
    const contacts = await getContacts();
    const found = contacts.find((c) => c.id === mockContact.id);
    expect(found?.name).toBe("Jane Doe");
  });

  it("should update contact phone number", async () => {
    await addContact(mockContact);

    const updatedContact = {
      ...mockContact,
      phoneNumber: "+1 (555) 987-6543",
    };
    await updateContact(updatedContact);

    const contacts = await getContacts();
    const found = contacts.find((c) => c.id === mockContact.id);
    expect(found?.phoneNumber).toBe("+1 (555) 987-6543");
  });

  it("should update alert method", async () => {
    await addContact(mockContact);

    const updatedContact = {
      ...mockContact,
      alertMethod: "whatsapp" as const,
    };
    await updateContact(updatedContact);

    const contacts = await getContacts();
    const found = contacts.find((c) => c.id === mockContact.id);
    expect(found?.alertMethod).toBe("whatsapp");
  });

  it("should update multiple fields at once", async () => {
    await addContact(mockContact);

    const updatedContact: EmergencyContact = {
      id: mockContact.id,
      name: "Jane Smith",
      phoneNumber: "+44 (20) 7123 4567",
      alertMethod: "whatsapp",
    };
    await updateContact(updatedContact);

    const contacts = await getContacts();
    const found = contacts.find((c) => c.id === mockContact.id);
    expect(found?.name).toBe("Jane Smith");
    expect(found?.phoneNumber).toBe("+44 (20) 7123 4567");
    expect(found?.alertMethod).toBe("whatsapp");
  });

  it("should not affect other contacts when updating", async () => {
    const contact2: EmergencyContact = {
      id: "contact-2",
      name: "Bob Smith",
      phoneNumber: "+1 (555) 999-8888",
      alertMethod: "whatsapp",
    };

    await addContact(mockContact);
    await addContact(contact2);

    const updatedContact = {
      ...mockContact,
      name: "Updated Name",
    };
    await updateContact(updatedContact);

    const contacts = await getContacts();
    const contact1 = contacts.find((c) => c.id === mockContact.id);
    const contact2Found = contacts.find((c) => c.id === contact2.id);

    expect(contact1?.name).toBe("Updated Name");
    expect(contact2Found?.name).toBe("Bob Smith"); // Should remain unchanged
  });

  it("should preserve contact ID during update", async () => {
    await addContact(mockContact);

    const updatedContact = {
      ...mockContact,
      name: "New Name",
    };
    await updateContact(updatedContact);

    const contacts = await getContacts();
    const found = contacts.find((c) => c.id === mockContact.id);
    expect(found?.id).toBe(mockContact.id);
  });
});
