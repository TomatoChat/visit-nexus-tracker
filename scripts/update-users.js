import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const usersToUpdate = [
  { id: 'dd193122-3094-4624-9821-73529262c4c7', firstName: 'Alessandro', lastName: 'Capellesso' },
  { id: 'ba4d7bca-2468-4fe2-82f3-c33c88647242', firstName: 'Paola', lastName: 'Poggioli' },
  { id: 'a064415b-477f-489c-8221-6bffa62e426b', firstName: 'Gioele', lastName: 'Cappellesso' },
  { id: 'd0893760-0982-4bf8-9090-03edcc48be91', firstName: 'Nicola', lastName: 'Mazzarolo' },
  { id: 'be0856ab-07be-4163-892c-16163b9f75cb', firstName: 'Antonio', lastName: 'Rocco' },
  { id: 'ad4af8ff-8688-44c9-9adb-24e437e833fa', firstName: 'Andrea', lastName: 'Rocco' },
];

async function updateUsers() {
  for (const user of usersToUpdate) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        firstName: user.firstName,
        lastName: user.lastName,
      }
    });
    if (error) {
      console.error(`Error updating ${user.id}:`, error.message);
    } else {
      console.log(`Updated ${user.id} (${user.firstName} ${user.lastName})`);
    }
  }
}

updateUsers();