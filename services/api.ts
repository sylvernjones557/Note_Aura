import { List } from '../types';

const API_URL = 'http://localhost:3001/lists';

export const api = {
  /**
   * Fetch all lists from the server
   */
  getLists: async (): Promise<List[]> => {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`Error fetching lists: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Create a new list
   */
  createList: async (list: List): Promise<List> => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(list),
    });
    if (!res.ok) {
      throw new Error(`Error creating list: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Update an existing list (includes updating its tasks and notes)
   */
  updateList: async (list: List): Promise<List> => {
    const res = await fetch(`${API_URL}/${list.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(list),
    });
    if (!res.ok) {
      throw new Error(`Error updating list: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Delete a list by ID
   */
  deleteList: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Error deleting list: ${res.statusText}`);
    }
  },
};
