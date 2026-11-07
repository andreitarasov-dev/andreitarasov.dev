export type StageId = 1 | 2;
export interface StorySection {id:string; title:string; html:string; photoId?:string; stage?:StageId; progress?:number}
export interface StoryPhoto {id:string; width:number; height:number; alt:string; caption?:string; fallbackUrl:string; sources:Array<{type:string;srcset:string}>; fullUrl:string; delivery:'legacy-preview'|'published'}
export interface RouteStage {id:StageId; coordinates:[number,number][]; anchors:Array<{sectionId:string;progress:number;label:string}>}
export interface ProgressAnchor {stage:StageId;sectionId:string;top:number;progress:number}
