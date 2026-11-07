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

export function buildStageGeometry(stage: RouteStage) {
  const line: LineString = {type:'LineString',coordinates:stage.coordinates};
  const projection = geoMercator().fitExtent([[25,35],[295,265]], line);
  const path = geoPath(projection)(line)!;
  return {path,viewBox:'0 0 320 300'};
}

export function buildOverviewGeometry(stages: RouteStage[]) {
  const routes: FeatureCollection<LineString> = {type:'FeatureCollection',features:stages.map(s=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:s.coordinates}}))};
  const projection = geoMercator().fitExtent([[50,40],[630,410]],routes);
  const draw = geoPath(projection);
  const topology=land as unknown as Topology;
  const geography=feature(topology,Object.values(topology.objects)[0]) as FeatureCollection<Geometry>;
  const cities=[['Kaliningrad',20.5,54.7,'kaliningrad'],['Berlin',13.41,52.52,'berlin'],['Amsterdam',4.9,52.37,'amsterdam'],['Copenhagen',12.57,55.68,'copenhagen'],['Stockholm',18.02,59.3,'stockholm']] as const;
  return {viewBox:'0 0 710 460',land:geography.features.map(g=>draw(g)).filter(Boolean),paths:routes.features.map(g=>draw(g)!),cities:cities.map(([label,lon,lat,sectionId])=>{const [x,y]=projection([lon,lat])!;return {label,sectionId,x,y};})};
}
