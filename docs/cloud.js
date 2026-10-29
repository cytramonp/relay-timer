let loading,currentUser,observed=false;const userListeners=new Set(),errorListeners=new Set();
export async function loadCloud(onUser,onError){
  if(onUser){userListeners.add(onUser);if(observed)queueMicrotask(()=>onUser(currentUser?.isAnonymous?null:currentUser));}if(onError)errorListeners.add(onError);
  if(loading)return loading;
  loading=(async()=>{
    const config=await fetch(new URL('./firebase-config.json',import.meta.url),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Cloud configuration could not load.');return r.json();});
    if(!config.apiKey||!config.projectId)throw Error('Google sync is not configured yet. Local saving still works.');
    const [appSDK,authSDK,dbSDK]=await Promise.all(['app','auth','firestore'].map(name=>import(`https://www.gstatic.com/firebasejs/13.1.0/firebase-${name}.js`)));
    const app=appSDK.initializeApp(config),auth=authSDK.getAuth(app),db=dbSDK.getFirestore(app);
    let unsubscribe;
    authSDK.onAuthStateChanged(auth,user=>{unsubscribe?.();unsubscribe=null;currentUser=user;observed=true;for(const listener of userListeners)Promise.resolve(listener(user?.isAnonymous?null:user)).catch(error=>{for(const report of errorListeners)report(error);});},error=>{for(const report of errorListeners)report(error);});
    return{
      watchSettings(uid,onRecords,onError){return dbSDK.onSnapshot(dbSDK.collection(db,'users',uid,'timerSettings'),snap=>onRecords(snap.docs.map(d=>d.data())),onError);},
      async writeSetting(uid,record){if(auth.currentUser?.uid!==uid)throw Error('Sign in again to sync your settings.');await dbSDK.setDoc(dbSDK.doc(db,'users',uid,'timerSettings',encodeURIComponent(record.key)),record);},
      async signIn(){const provider=new authSDK.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});return authSDK.signInWithPopup(auth,provider);},
      async signOut(){unsubscribe?.();unsubscribe=null;return authSDK.signOut(auth);},
      watch(uid,onRecords){unsubscribe?.();unsubscribe=dbSDK.onSnapshot(dbSDK.collection(db,'users',uid,'meetings'),snap=>onRecords(snap.docs.map(d=>d.data())),error=>{for(const report of errorListeners)report(error);});},
      async write(uid,record){if(auth.currentUser?.uid!==uid)throw Error('Sign in again to sync this meeting.');await dbSDK.setDoc(dbSDK.doc(db,'users',uid,'meetings',record.id),record);},
      async roomAuth(){await auth.authStateReady();if(!auth.currentUser)await authSDK.signInAnonymously(auth);return auth.currentUser.uid;},
      async createRoom(id,controlToken,projection){const uid=await this.roomAuth(),expiresAt=Date.now()+86400000;const batch=dbSDK.writeBatch(db);batch.set(dbSDK.doc(db,'roomOwners',id),{uid,controlToken,expiresAt});batch.set(dbSDK.doc(db,'liveRooms',id),{...projection,expiresAt});await batch.commit();return{uid,expiresAt};},
      publishRoom(id,data){return dbSDK.updateDoc(dbSDK.doc(db,'liveRooms',id),data);},
      watchRoom(id,onData,onFailure){return dbSDK.onSnapshot(dbSDK.doc(db,'liveRooms',id),snap=>onData(snap.exists()?snap.data():null),onFailure);},
      watchCommands(id,onCommand,onFailure){return dbSDK.onSnapshot(dbSDK.collection(db,'liveRooms',id,'commands'),snapshot=>{for(const change of snapshot.docChanges())if(change.type==='added')onCommand(change.doc.id,change.doc.data());},onFailure);},
      async sendCommand(id,token,action){await this.roomAuth();const commandId=crypto.randomUUID();await dbSDK.setDoc(dbSDK.doc(db,'liveRooms',id,'commands',commandId),{action,token,at:Date.now()});return commandId;},
      clearCommand(id,commandId){return dbSDK.deleteDoc(dbSDK.doc(db,'liveRooms',id,'commands',commandId));},
      async endRoom(id){await dbSDK.deleteDoc(dbSDK.doc(db,'liveRooms',id));const commands=await dbSDK.getDocs(dbSDK.collection(db,'liveRooms',id,'commands'));for(let i=0;i<commands.docs.length;i+=450){const batch=dbSDK.writeBatch(db);commands.docs.slice(i,i+450).forEach(d=>batch.delete(d.ref));await batch.commit();}await dbSDK.deleteDoc(dbSDK.doc(db,'roomOwners',id));}
    };
  })().catch(error=>{loading=null;throw error;});return loading;
}
