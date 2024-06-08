"use client"

import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { useEffect, useRef, useState } from "react";
import { fabric } from 'fabric';
import { handleCanvasMouseDown, handleCanvasMouseUp, handleCanvaseMouseMove, handleResize, initializeFabric, renderCanvas } from "@/lib/canvas";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { ActiveElement } from "@/types/type";
import { defaultNavElement } from "@/constants";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { handleImageUpload } from "@/lib/shapes";

export default function Page() {
  const undo = useUndo();
  const redo = useRedo();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const canvasObjects = useStorage((root) => root.canvasObjects);

  const syncShapeInStorage = useMutation(({ storage }, object) => {
    
    if (!object) return;
    const { objectId } = object;

    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.set(objectId, shapeData);
  }, []);

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  });

  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects");

    if (!canvasObjects || canvasObjects.size === 0) return true;

    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }
    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({ storage }, shapeId) => {
    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.delete(shapeId);
  }, []);

  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      case "reset":
        deleteAllShapes();
        fabricRef.current?.clear();
        setActiveElement(defaultNavElement);
        break;

      case "delete":
        handleDelete(fabricRef.current as any, deleteShapeFromStorage);
        setActiveElement(defaultNavElement);
        break;

      case "image":
        imageInputRef.current?.click();
        isDrawing.current = false;

        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }
        break;

      case "comments":
        break;

      default:
        selectedShapeRef.current = elem?.value as string;
        break;
    }
  };
  
  useEffect(() => {
    // initialize the fabric canvas
    const canvas = initializeFabric({
      canvasRef,
      fabricRef,
    });

    /**
     * listen to the mouse down event on the canvas which is fired when the
     * user clicks on the canvas
     */
    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        selectedShapeRef,
        isDrawing,
        shapeRef,
      });
    });

    /**
     * listen to the mouse move event on the canvas which is fired when the
     * user moves the mouse on the canvas
    
     */
    canvas.on("mouse:move", (options) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        selectedShapeRef,
        shapeRef,
        syncShapeInStorage,
      });
    });

    /**
     * listen to the mouse up event on the canvas which is fired when the
     * user releases the mouse on the canvas
    
     */
    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        activeObjectRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
      });
    });

    window.addEventListener("resize", () => {
      handleResize({
        canvas: fabricRef.current,
      });
    });

 
    window.addEventListener("keydown", (e) =>
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage,
      })
    );


    return () => {
      canvas.dispose();
      window.removeEventListener("resize", () => {
        handleResize({
          canvas: null,
        });
      });

      window.removeEventListener("keydown", (e) =>
        handleKeyDown({
          e,
          canvas: fabricRef.current,
          undo,
          redo,
          syncShapeInStorage,
          deleteShapeFromStorage,
        })
      );
    };
  }, [canvasRef]);

  // render the canvas when the canvasObjects from live storage changes
  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef,
    });
  }, [canvasObjects]);



  return (
      <main className="h-screen overflow-hidden">
        <Navbar
        activeElement={activeElement}
        handleImageUpload={(e: any) => {
          e.stopPropagation();
          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage,
          });
        }}
        handleActiveElement={handleActiveElement}
      />
        <section className='flex h-full flex-row'>
        <LeftSidebar allShapes={Array.from(canvasObjects)} />

        <Live canvasRef={canvasRef} undo={undo} redo={redo} />

        <RightSidebar
          syncShapeInStorage={syncShapeInStorage}
        />
      </section>
      </main>
  );
}