
declare module 'fabric' {
  export declare class Canvas {
    constructor(el: HTMLCanvasElement, options?: any);
    add(...objects: Object[]): Canvas;
    remove(object: Object): Canvas;
    clear(): Canvas;
    renderAll(): Canvas;
    dispose(): void;
    getObjects(): Object[];
    setActiveObject(object: Object): Canvas;
    bringForward(object: Object): Canvas;
    sendBackward(object: Object): Canvas;
    on(event: string, handler: Function): Canvas;
    off(event: string, handler: Function): void;
  }

  export declare class Object {
    left: number;
    top: number;
    width: number;
    height: number;
    selectable: boolean;
    evented: boolean;
    set(options: any): Object;
    get(property: string): any;
  }

  export declare class Rect extends Object {
    constructor(options?: any);
  }

  export declare class Text extends Object {
    constructor(text: string, options?: any);
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    fill: string;
    textAlign: string;
  }

  export declare class Textbox extends Text {
    constructor(text: string, options?: any);
  }

  export declare class Group extends Object {
    constructor(objects: Object[], options?: any);
  }
}
