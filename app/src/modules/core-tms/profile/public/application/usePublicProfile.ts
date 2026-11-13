'use client';
import { useEffect,useState } from 'react';
import type { PublicActorProfile,PublicProfilePort } from '../domain/public-profile';
export function usePublicProfile(client:PublicProfilePort) {
 const [revision,refresh]=useState(0);
 const [state,setState]=useState<{client:PublicProfilePort;profile:PublicActorProfile|null;loading:boolean;error:unknown}>
  ({client,profile:null,loading:true,error:null});
 useEffect(()=>{
  const controller=new AbortController();setState({client,profile:null,loading:true,error:null});
  client.read(controller.signal).then(profile=>{if(!controller.signal.aborted)setState({client,profile,loading:false,error:null});})
   .catch(error=>{if(!controller.signal.aborted)setState({client,profile:null,loading:false,error});});
  return()=>controller.abort();
 },[client,revision]);
 return {...(state.client===client?state:{profile:null,loading:true,error:null}),retry:()=>refresh(v=>v+1)};
}
