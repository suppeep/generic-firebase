import firebase from "firebase/app";

let asyncFirestore = null;

export const firestore = () => {
    if (asyncFirestore === null) {
        asyncFirestore =
            import (
                /* webpackChunkName: "chunk-firestore" */
                "firebase/firestore"
            ).then(() => {
                firebase.firestore().settings({});

                // firebase.firestore().enablePersistence({ synchronizeTabs: true }); // gives erros

                return firebase.firestore(); //firebase.firestore().enablePersistance(); // for offline mode
            });
    }

    return asyncFirestore;
};
