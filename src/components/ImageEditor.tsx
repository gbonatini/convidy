import React, { useState, useCallback, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RotateCw, Move, ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditorProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: string) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  image,
  isOpen,
  onClose,
  onSave,
}) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 60,
    x: 0,
    y: 20,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Set default crop to center the image
    setCrop({
      unit: '%',
      width: 100,
      height: Math.min(60, (height / width) * 100),
      x: 0,
      y: Math.max(0, (100 - Math.min(60, (height / width) * 100)) / 2),
    });
  }, []);

  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelRatio = window.devicePixelRatio;

    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // Apply transformations
    ctx.save();
    ctx.translate(completedCrop.width / 2, completedCrop.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      -completedCrop.width / 2,
      -completedCrop.height / 2,
      completedCrop.width,
      completedCrop.height
    );

    ctx.restore();

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [completedCrop, scale, rotation]);

  const handleSave = async () => {
    const croppedImageUrl = await generateCroppedImage();
    if (croppedImageUrl) {
      onSave(croppedImageUrl);
    }
    onClose();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetPosition = () => {
    setCrop({
      unit: '%',
      width: 100,
      height: 60,
      x: 0,
      y: 20,
    });
    setScale(1);
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Imagem do Evento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Crop Area */}
          <div className="flex justify-center bg-muted/20 p-4 rounded-lg">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={16 / 9}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={image}
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  maxWidth: '100%',
                  maxHeight: '400px',
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Position Controls */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Move className="h-4 w-4" />
                Posicionamento
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-12">X:</Label>
                  <Slider
                    value={[crop.x || 0]}
                    onValueChange={([value]) => setCrop(prev => ({ ...prev, x: value }))}
                    max={100 - (crop.width || 0)}
                    step={1}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-12">Y:</Label>
                  <Slider
                    value={[crop.y || 0]}
                    onValueChange={([value]) => setCrop(prev => ({ ...prev, y: value }))}
                    max={100 - (crop.height || 0)}
                    step={1}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Scale Control */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom ({Math.round(scale * 100)}%)
              </Label>
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value)}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Rotação ({rotation}°)
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[rotation]}
                  onValueChange={([value]) => setRotation(value)}
                  min={0}
                  max={360}
                  step={15}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetPosition}
              className="flex items-center gap-2"
            >
              Resetar
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Salvar Edição
          </Button>
        </DialogFooter>

        {/* Hidden canvas for generating cropped image */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </DialogContent>
    </Dialog>
  );
};