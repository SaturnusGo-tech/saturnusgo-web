import React,{createContext,useContext,useMemo} from 'react';
import {detailRu} from './detail-copy.js';
import {sceneRu} from './scene-copy.js';
import {baseRu} from './base-copy.js';

const ru={...detailRu,...sceneRu,...baseRu};
const english=value=>value;
const russian=value=>typeof value==='string'?(ru[value]??value):value;
export const getFilmTranslator=locale=>locale==='ru'?russian:english;
const FilmContext=createContext({locale:'en',theme:'dark',t:english});

export function FilmProvider({locale,theme,children}){
 const value=useMemo(()=>({locale,theme,t:getFilmTranslator(locale)}),[locale,theme]);
 return <FilmContext.Provider value={value}>{children}</FilmContext.Provider>;
}
export const useFilmCopy=()=>useContext(FilmContext);
