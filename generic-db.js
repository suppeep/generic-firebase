import firebase from "firebase/app";
import { firestore } from "./async-firestore";

let lastVisibleSnapShot = {};
let allData = [];

let lastVisibleSnapShotComment = {};
let allCommentData = [];

export default class GenericDB {
  collectionPath;
  constructor(collectionPath) {
    this.collectionPath = collectionPath;
  }

  /**
   * Create a document in the collection
   * @param data
   * @param id
   */
  async create(data, id = null) {
    const collectionRef = (await firestore()).collection(this.collectionPath);
    const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();

    const dataToCreate = {
      ...data,
      createTimestamp: serverTimestamp,
      updateTimestamp: serverTimestamp,
    };

    const createPromise =
      id === null // Create doc with generated id
        ? collectionRef.add(dataToCreate).then((doc) => doc.id) // Create doc with custom id
        : collectionRef
            .doc(id)
            .set(dataToCreate)
            .then(() => id);

    const docId = await createPromise;

    return {
      id: docId,
      ...data,
      createTimestamp: this.convertObjectTimestampPropertiesToDate(
        serverTimestamp
      )
    };
  }
  
  /**
   * Read a document in the collection
   * @param id
   */
  async read(id) {
    const result = await (await firestore())
      .collection(this.collectionPath)
      .doc(id)
      .get();

    const data = result.exists ? result.data() : null;

    if (data) {
      this.convertObjectTimestampPropertiesToDate(data);
      return { id, ...data };
    } else {
      return null;
    }
  }

  /**
   * Read all documents in the collection following constraints
   * @param constraints
   */
  async readAll(constraints) {
    const collectionRef = (await firestore()).collection(this.collectionPath);
    let query = collectionRef;

    if (constraints) {
      constraints.forEach((constraint) => (query = query.where(...constraint)));
    }

    const formatResult = (result) =>
      result.docs.map((ref) =>
        this.convertObjectTimestampPropertiesToDate({
          id: ref.id,
          ...ref.data(),
        })
      );

    return query.get().then(formatResult);
  }

  /**
   * Get the collection size
   */
  async getSize() {
    const result = await (await firestore())
      .collection(this.collectionPath)
      .get();

    const data = result.size;

    if (data) {
      this.convertObjectTimestampPropertiesToDate(data);
      return data;
    } else {
      return null;
    }
  }

  /**
   * Read inside sub-collection for specific user detail following constraints
   * @param postId
   */
  async readSingle(limit) {
    const collectionRef = (await firestore()).collection(this.collectionPath);
    let query = collectionRef.orderBy("createTimestamp", "desc").limit(limit);
    let all = [];

    const result = query.get().then((snap) => {
      if (snap.size === 0) return;

      snap.forEach((doc) => {
        const data = doc.exists ? doc.data() : null;
        if (data) {
          let id = doc.id;
          const docs = { id, ...data };
          all.push(docs);
        } else {
          return null;
        }
      });
      return all;
    });
    return result;
  }

  /**
   * Update a document in the collection
   * @param data
   */
  async update(data) {
    const id = data.id;

    await (await firestore())
      .collection(this.collectionPath)
      .doc(id)
      .update({
        data,
        updateTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

    return id;
  }

  /**
   * Update a document in the collection
   * @param data
   */
  async updateInside(data, path, userId) {
    await (await firestore())
      .collection(this.collectionPath)
      .doc(userId)
      .update({
        [path]: data,
      });
  }

  /**
   * Update a document 'array' in the collection
   * @param data
   */
  async updateArrayInside(data, path, userId) {
    await (await firestore())
      .collection(this.collectionPath)
      .doc(userId)
      .update({
        [path]: firebase.firestore.FieldValue.arrayUnion(data),
      });
  }

  /**
   * Delete a document in the collection
   * @param id
   */
  async delete(id) {
    return (await firestore())
      .collection(this.collectionPath)
      .doc(id)
      .delete();
  }

  /**
   * Delete a document 'array' in the collection
   * @param data
   */
  async deleteArrayItem(data, path, userId) {
    await (await firestore())
      .collection(this.collectionPath)
      .doc(userId)
      .update({
        [path]: firebase.firestore.FieldValue.arrayRemove(data),
      });
  }

  /**
   * Delete all documents in the collection
   * @param id
   */
  async deleteAll(id) {
    return (await firestore())
      .collection(this.collectionPath)
      .get()
      .then((res) => {
        res.forEach((element) => {
          element.ref.delete();
        });
      });
  }

  /**
   * Convert all object Timestamp properties to date
   * @param obj
   */
  convertObjectTimestampPropertiesToDate(obj) {
    Object.keys(obj)
      .filter((prop) => obj[prop] instanceof Object)
      .forEach((prop) =>
        obj[prop] instanceof firebase.firestore.Timestamp
          ? (obj[prop] = obj[prop].toDate())
          : this.convertObjectTimestampPropertiesToDate(obj[prop])
      );
    return obj;
  }
}
