import React, { useRef, useEffect, useState } from 'react';
import { Canvas as FabricCanvas, Image as FabricImage } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  RotateCw, 
  RotateCcw, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Download,
  Loader2,
  Trash2
} from 'lucide-react';

interface LogoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onLogoSaved: (logoUrl: string) => void;
  currentLogoUrl?: string;
  companyId: string;
}

export const LogoEditor: React.FC<LogoEditorProps> = ({
  isOpen,
  onClose,
  onLogoSaved,
  currentLogoUrl,
  companyId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [logoImage, setLogoImage] = useState<FabricImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scale, setScale] = useState([1]);
  const [rotation, setRotation] = useState([0]);
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 400,
      height: 400,
      backgroundColor: "#f8f9fa",
    });

    setFabricCanvas(canvas);

    // Se há logo atual, carregá-lo
    if (currentLogoUrl) {
      loadImageToCanvas(canvas, currentLogoUrl);
    }

    return () => {
      canvas.dispose();
      setFabricCanvas(null);
      setLogoImage(null);
    };
  }, [isOpen, currentLogoUrl]);

  const loadImageToCanvas = (canvas: FabricCanvas, imageUrl: string) => {
    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous'
    }).then((img) => {
      // Centralizar e redimensionar a imagem para caber no canvas
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      
      img.scaleToWidth(Math.min(canvasWidth * 0.8, img.width || 200));
      
      // Centralizar manualmente
      img.set({
        left: (canvasWidth - (img.getScaledWidth() || 0)) / 2,
        top: (canvasHeight - (img.getScaledHeight() || 0)) / 2
      });
      
      canvas.add(img);
      canvas.setActiveObject(img);
      setLogoImage(img);
      canvas.renderAll();
    }).catch((error) => {
      console.error('Erro ao carregar imagem:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a imagem.",
      });
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas) return;

    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      // Limpar canvas
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#f8f9fa";
      
      // Carregar nova imagem
      loadImageToCanvas(fabricCanvas, imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleScaleChange = (value: number[]) => {
    if (!logoImage) return;
    const newScale = value[0];
    logoImage.scale(newScale);
    fabricCanvas?.renderAll();
    setScale(value);
  };

  const handleRotationChange = (value: number[]) => {
    if (!logoImage) return;
    const newRotation = value[0];
    logoImage.rotate(newRotation);
    fabricCanvas?.renderAll();
    setRotation(value);
  };

  const handleRotateClockwise = () => {
    if (!logoImage) return;
    const currentRotation = logoImage.angle || 0;
    const newRotation = (currentRotation + 90) % 360;
    logoImage.rotate(newRotation);
    fabricCanvas?.renderAll();
    setRotation([newRotation]);
  };

  const handleRotateCounterClockwise = () => {
    if (!logoImage) return;
    const currentRotation = logoImage.angle || 0;
    const newRotation = (currentRotation - 90 + 360) % 360;
    logoImage.rotate(newRotation);
    fabricCanvas?.renderAll();
    setRotation([newRotation]);
  };

  const handleSaveLogo = async () => {
    if (!fabricCanvas || !logoImage) {
      toast({
        variant: "destructive",
        title: "Nenhuma imagem",
        description: "Por favor, adicione uma imagem primeiro.",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Exportar canvas como blob
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.9,
        multiplier: 2, // Para melhor qualidade
      });

      // Converter dataURL para blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Gerar nome único para o arquivo
      const fileName = `logo-${companyId}-${Date.now()}.png`;
      const filePath = `logos/${fileName}`;

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('event-images') // Usando o bucket existente
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) throw error;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(data.path);

      onLogoSaved(publicUrl);
      onClose();
      
      toast({
        title: "Logo salvo!",
        description: "O logotipo foi salvo com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao salvar logo:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o logotipo.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearLogo = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#f8f9fa";
    fabricCanvas.renderAll();
    setLogoImage(null);
    setScale([1]);
    setRotation([0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editor de Logotipo</DialogTitle>
          <DialogDescription>
            Faça upload e ajuste o logotipo da sua empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload de arquivo */}
          <div className="space-y-2">
            <Label>Selecionar Imagem</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Escolher Arquivo</span>
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Canvas de edição */}
          <div className="border rounded-lg overflow-hidden bg-muted/30">
            <canvas ref={canvasRef} className="w-full" />
          </div>

          {/* Controles de edição */}
          {logoImage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Controles de escala */}
                <div className="space-y-2">
                  <Label>Tamanho: {scale[0].toFixed(1)}x</Label>
                  <Slider
                    value={scale}
                    onValueChange={handleScaleChange}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Controles de rotação */}
                <div className="space-y-2">
                  <Label>Rotação: {rotation[0]}°</Label>
                  <Slider
                    value={rotation}
                    onValueChange={handleRotationChange}
                    min={0}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Botões de ação rápida */}
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotateCounterClockwise}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotateClockwise}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearLogo}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLogo} disabled={isUploading || !logoImage}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Salvar Logo
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};