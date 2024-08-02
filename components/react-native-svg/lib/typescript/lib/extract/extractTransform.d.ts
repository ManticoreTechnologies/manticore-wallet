import type { TransformsStyle } from 'react-native';
import type { ColumnMajorTransformMatrix, TransformedProps, TransformProps } from './types';
type TransformsStyleArray = Exclude<TransformsStyle['transform'], string>;
export declare function transformsArrayToProps(transformObjectsArray: TransformsStyleArray): TransformProps;
export declare function props2transform(props: TransformProps | undefined): TransformedProps | null;
export declare function transformToMatrix(props: TransformedProps | null, transform: TransformProps['transform']): ColumnMajorTransformMatrix | null;
export default function extractTransform(props: TransformProps | TransformProps['transform']): ColumnMajorTransformMatrix | null;
export {};
//# sourceMappingURL=extractTransform.d.ts.map