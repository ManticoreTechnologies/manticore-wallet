import { Component } from 'react';
import { NativeMethods } from 'react-native';
import { NumberProp } from '../../lib/extract/types';
export interface FilterPrimitiveCommonProps {
    x?: NumberProp;
    y?: NumberProp;
    width?: NumberProp;
    height?: NumberProp;
    result?: string;
}
export default class FilterPrimitive<P> extends Component<P & FilterPrimitiveCommonProps> {
    [x: string]: unknown;
    root: (FilterPrimitive<P> & NativeMethods) | null;
    static defaultPrimitiveProps: {
        x: string;
        y: string;
        width: string;
        height: string;
    };
    refMethod: (instance: (FilterPrimitive<P> & NativeMethods) | null) => void;
    setNativeProps: (props: P) => void;
}
//# sourceMappingURL=FilterPrimitive.d.ts.map