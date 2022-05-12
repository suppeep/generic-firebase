// Simple login in method to show the purpos of the generic firestore class UsersDB

import UsersDB from "./users-db";

export default  {
    login: async({ commit, dispatch }, user) => {
        return new Promise(async(resolve, reject) => {
            const userFromFirebase = await new UsersDB().read(user.uid); // get currentUser uid if user is stored in db if not set new User
            const getUser =
                userFromFirebase === null ?
                await createNewUserFromFirebaseAuthUser(user) // if there is no user => create new User
                :
                userFromFirebase; // else if there is a user

            if (userFromFirebase !== null) {
              // do something because no user was found
            } else {
              // do something with the found user
            }
        });
    },
}
