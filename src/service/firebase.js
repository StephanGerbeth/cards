import firebase from 'firebase/app';
import 'firebase/database';
import Database from '@/service/firebase/Database';

const databases = new Map();
class App {
  constructor() {
    this.app = null;
  }

  getApp () {
    if (!this.app) {
      this.app = firebase.initializeApp({
        apiKey: 'AIzaSyCqx6ZvhIUSJaU_1BBjQZaW6h1AvIVDz2U',
        authDomain: 'cards-ec2cf.firebaseapp.com',
        databaseURL: 'https://cards-ec2cf.firebaseio.com',
        projectId: 'cards-ec2cf',
        storageBucket: 'cards-ec2cf.appspot.com',
        messagingSenderId: '149386928410',
        appId: '1:149386928410:web:4de322ce1f44c3ad414ca3'

      });
    }
    return this.app;
  }

  getDatabase (name) {
    if (!databases.has(name)) {
      databases.set(name, new Database(firebase.database(this.getApp()).ref(name)));
    }
    return databases.get(name);
  }

  getTimestamp () {
    return firebase.database.ServerValue.TIMESTAMP;
  }
}

export default new App();
