
/**
 * Definições de tipos para fabric.js
 */
declare module 'fabric' {
  export { fabric };
  
  namespace fabric {
    class Canvas {
      constructor(element: HTMLCanvasElement | string, options?: any);
      add(...objects: Object[]): Canvas;
      remove(object: Object): Canvas;
      clear(): Canvas;
      renderAll(): Canvas;
      dispose(): void;
      getObjects(): Object[];
      setActiveObject(object: Object): Canvas;
      bringForward(object: Object): Canvas;
      sendBackward(object: Object): Canvas;
      getWidth(): number;
      getHeight(): number;
      setWidth(value: number): Canvas;
      setHeight(value: number): Canvas;
      on(event: string, handler: Function): Canvas;
      off(event: string, handler: Function): Canvas;
      freeDrawingBrush: {
        color: string;
        width: number;
      };
      isDrawingMode: boolean;
    }

    class Object {
      left: number;
      top: number;
      width: number;
      height: number;
      set(props: any): Object;
      get(property: string): any;
      setCoords(): Object;
      toObject(): any;
    }

    class Rect extends Object {
      constructor(options?: any);
    }

    class Textbox extends Object {
      constructor(text: string, options?: any);
      text: string;
      fontSize: number;
      fontFamily: string;
      fontWeight: string;
      fill: string;
      textAlign: string;
    }

    class Text extends Object {
      constructor(text: string, options?: any);
      text: string;
      fontSize: number;
      fontFamily: string;
    }

    class Group extends Object {
      constructor(objects: Object[], options?: any);
    }
  }
}
