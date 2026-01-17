import { useState, useCallback, useEffect } from 'react';
import type { ContactWithDetails, CreateInvitationResponse } from '@alles-gut/shared';
import { api } from '@/services/api';

interface UseContactsReturn {
  contacts: ContactWithDetails[];
  isLoading: boolean;
  error: string | null;
  refreshContacts: () => Promise<void>;
  createInvitation: () => Promise<CreateInvitationResponse>;
  acceptInvitation: (inviteCode: string) => Promise<void>;
  removeContact: (contactId: string) => Promise<void>;
}

export function useContacts(): UseContactsReturn {
  const [contacts, setContacts] = useState<ContactWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshContacts = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getContacts();
      setContacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInvitation = useCallback(async (): Promise<CreateInvitationResponse> => {
    const invitation = await api.createInvitation();
    return invitation;
  }, []);

  const acceptInvitation = useCallback(async (inviteCode: string) => {
    try {
      setError(null);
      const newContact = await api.acceptInvitation({ inviteCode });
      setContacts(prev => [...prev, newContact]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      throw err;
    }
  }, []);

  const removeContact = useCallback(async (contactId: string) => {
    try {
      setError(null);
      await api.removeContact(contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove contact');
      throw err;
    }
  }, []);

  useEffect(() => {
    refreshContacts();
  }, [refreshContacts]);

  return {
    contacts,
    isLoading,
    error,
    refreshContacts,
    createInvitation,
    acceptInvitation,
    removeContact,
  };
}
