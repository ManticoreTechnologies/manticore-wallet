import * as React from 'react';
import { NumberProp, Units } from '../../lib/extract/types';
import Shape from '../Shape';
export interface FilterProps {
    children?: React.ReactNode;
    id?: string;
    x?: NumberProp;
    y?: NumberProp;
    width?: NumberProp;
    height?: NumberProp;
    filterUnits?: Units;
    primitiveUnits?: Units;
}
export default class Filter extends Shape<FilterProps> {
    static displayName: string;
    static defaultProps: {
        x: string;
        y: string;
        width: string;
        height: string;
        filterUnits: string;
    };
    render(): React.JSX.Element;
}
//# sourceMappingURL=Filter.d.ts.map