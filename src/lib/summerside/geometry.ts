import { feature } from 'topojson-client';
import { geoMercator, geoPath } from 'd3-geo';
import type { Topology } from 'topojson-specification';
import type { LineString, FeatureCollection, Geometry } from 'geojson';
import type { RouteStage } from './types';
import land from '../../content/summerside/source/route_map.json' with { type: 'json' };

export function decodeRoute(topology: Topology): [number,number][] {
  const result = feature(topology, Object.values(topology.objects)[0]);
  const shapes = result.type === 'FeatureCollection' ? result.features : [result];
  const coordinates: [number,number][] = [];
  for (const shape of shapes) {
    if (shape.geometry.type !== 'LineString') throw new Error('Expected ordered LineString route');
    for (const point of shape.geometry.coordinates) {
      const previous=coordinates.at(-1);
      if (!previous || previous[0]!==point[0] || previous[1]!==point[1]) coordinates.push([point[0],point[1]]);
    }
  }
  return coordinates;
}

export function buildStageGeometry(stage: RouteStage, compact=false) {
  const line: LineString = {type:'LineString',coordinates:stage.coordinates};
  const projection = geoMercator().angle(compact ? (stage.id===2 ? -55 : -15) : (stage.id===1 ? 65 : 35))
    .fitExtent(compact ? [[30,35],[610,105]] : [[70,40],[190,560]], line);
  const path = geoPath(projection)(line)!;
  // Same city selection as the original RouteScroller, with English labels.
  const locations = stage.id===1 ? [
    ['Kaliningrad',20.5,54.7,'kaliningrad'], ['Malbork',19.03,54.03,'malbork'],
    ['Wałcz',16.48,53.27,'walcz'], ['Berlin',13.41,52.52,'berlin'],
    ['Magdeburg',11.62,52.14,'canal'], ['Hanover',9.72,52.38,'canal'],
    ['Amsterdam',4.9,52.37,'amsterdam'],
  ] as const : [
    ['Copenhagen',12.57,55.68,'copenhagen'], ['Helsingborg',12.69,56.07,'sweden'],
    ['Jönköping',14.16,57.77,'jonkoping'], ['Norrköping',16.18,58.6,'norrkoping'],
    ['Stockholm',17.98,59.30,'stockholm'],
  ] as const;
  const cities=locations.map(([label,lon,lat,sectionId],i)=>{
    const [x,y]=projection([lon,lat])!;
    const left=compact ? false : (stage.id===1 ? i%2===1 : i===1 || i===2);
    return {label,sectionId,x,y,dx:compact?0:left?-9:9,dy:compact?(i%2===0?20:132)-y:4,align:compact?'middle':left?'end':'start'};
  });
  return {path,cities,viewBox:compact?'0 0 640 140':'0 0 280 600'};
}

export function buildOverviewGeometry(stages: RouteStage[]) {
  const routes: FeatureCollection<LineString> = {type:'FeatureCollection',features:stages.map(s=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:s.coordinates}}))};
  const projection = geoMercator().fitExtent([[50,40],[630,410]],routes);
  const draw = geoPath(projection);
  const topology=land as unknown as Topology;
  const geography=feature(topology,Object.values(topology.objects)[0]) as FeatureCollection<Geometry>;
  // Label offsets keep neighbouring city names clear of one another and the route.
  const cities=[
    ['Kaliningrad',20.5,54.7,'kaliningrad',8,-10],
    ['Malbork',19.03,54.04,'malbork',8,18],
    ['Wałcz',16.47,53.27,'walcz',8,18],
    ['Berlin',13.41,52.52,'berlin',8,18],
    ['Hanover',9.73,52.37,'canal',0,-12],
    ['Amsterdam',4.9,52.37,'amsterdam',8,-10],
    ['Copenhagen',12.57,55.68,'copenhagen',8,-10],
    ['Jönköping',14.16,57.78,'jonkoping',-8,-10],
    ['Norrköping',16.19,58.59,'norrkoping',8,18],
    ['Stockholm',18.02,59.3,'stockholm',8,-10],
  ] as const;
  return {viewBox:'0 0 710 460',land:geography.features.map(g=>draw(g)).filter(Boolean),paths:routes.features.map(g=>draw(g)!),cities:cities.map(([label,lon,lat,sectionId,dx,dy])=>{const [x,y]=projection([lon,lat])!;return {label,sectionId,x,y,dx,dy};})};
}
