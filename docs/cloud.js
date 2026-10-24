let loading;
export async function loadCloud(onUser,onError){
  if(loading)return loading;
  loading=(async()=>{
    const config=await fetch('./firebase-config.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Cloud configuration could not load.');return r.json();});
    if(!config.apiKey||!config.projectId)throw Error('Google sync is not configured yet. Local saving still works.');
    const [appSDK,authSDK,dbSDK]=await Promise.all(['app','auth','firestore'].map(name=>import(`https://www.gstatic.com/firebasejs/13.1.0/firebase-${name}.js`)));
    const app=appSDK.initializeApp(config),auth=authSDK.getAuth(app),db=dbSDK.getFirestore(app);
    let unsubscribe;
    authSDK.onAuthStateChanged(auth,user=>{unsubscribe?.();unsubscribe=null;onUser(user);},onError);
    return{
      async signIn(){const provider=new authSDK.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});return authSDK.signInWithPopup(auth,provider);},
      async signOut(){unsubscribe?.();unsubscribe=null;return authSDK.signOut(auth);},
      watch(uid,onRecords){unsubscribe?.();unsubscribe=dbSDK.onSnapshot(dbSDK.collection(db,'users',uid,'meetings'),snap=>onRecords(snap.docs.map(d=>d.data())),onError);},
      async write(uid,record){if(auth.currentUser?.uid!==uid)throw Error('Sign in again to sync this meeting.');await dbSDK.setDoc(dbSDK.doc(db,'users',uid,'meetings',record.id),record);}
    };
  })().catch(error=>{loading=null;throw error;});return loading;
}
