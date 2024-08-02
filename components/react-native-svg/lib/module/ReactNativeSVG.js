import Shape from './elements/Shape';
import Rect from './elements/Rect';
import Circle from './elements/Circle';
import Ellipse from './elements/Ellipse';
import Polygon from './elements/Polygon';
import Polyline from './elements/Polyline';
import Line from './elements/Line';
import Svg from './elements/Svg';
import Path from './elements/Path';
import G from './elements/G';
import Text from './elements/Text';
import TSpan from './elements/TSpan';
import TextPath from './elements/TextPath';
import Use from './elements/Use';
import Image from './elements/Image';
import Symbol from './elements/Symbol';
import Defs from './elements/Defs';
import LinearGradient from './elements/LinearGradient';
import RadialGradient from './elements/RadialGradient';
import Stop from './elements/Stop';
import ClipPath from './elements/ClipPath';
import Pattern from './elements/Pattern';
import Mask from './elements/Mask';
import Marker from './elements/Marker';
import ForeignObject from './elements/ForeignObject';
import Filter from './elements/filters/Filter';
import FeColorMatrix from './elements/filters/FeColorMatrix';
import { parse, SvgAst, SvgFromUri, SvgFromXml, SvgUri, SvgXml, camelCase, fetchText } from './xml';
import { RNSVGCircle, RNSVGClipPath, RNSVGDefs, RNSVGEllipse, RNSVGForeignObject, RNSVGGroup, RNSVGImage, RNSVGLine, RNSVGLinearGradient, RNSVGMarker, RNSVGMask, RNSVGPath, RNSVGPattern, RNSVGRadialGradient, RNSVGRect, RNSVGSvgAndroid, RNSVGSvgIOS, RNSVGSymbol, RNSVGText, RNSVGTextPath, RNSVGTSpan, RNSVGUse, RNSVGFilter, RNSVGFeColorMatrix } from './fabric';
export { SvgCss, SvgCssUri, SvgWithCss, SvgWithCssUri, inlineStyles, LocalSvg, WithLocalSvg, loadLocalRawResource } from './deprecated';
export * from './lib/extract/types';
export { Svg, Circle, Ellipse, G, Text, TSpan, TextPath, Path, Polygon, Polyline, Line, Rect, Use, Image, Symbol, Defs, LinearGradient, RadialGradient, Stop, ClipPath, Pattern, Mask, Marker, ForeignObject, parse, SvgAst, SvgFromUri, SvgFromXml, SvgUri, SvgXml, camelCase, fetchText, Shape, Filter, FeColorMatrix, RNSVGMarker, RNSVGMask, RNSVGPattern, RNSVGClipPath, RNSVGRadialGradient, RNSVGLinearGradient, RNSVGDefs, RNSVGSymbol, RNSVGImage, RNSVGUse, RNSVGTextPath, RNSVGTSpan, RNSVGText, RNSVGGroup, RNSVGPath, RNSVGLine, RNSVGEllipse, RNSVGCircle, RNSVGRect, RNSVGSvgAndroid, RNSVGSvgIOS, RNSVGForeignObject, RNSVGFilter, RNSVGFeColorMatrix };
export default Svg;
//# sourceMappingURL=ReactNativeSVG.js.map