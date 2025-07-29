import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';

const eventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Hora é obrigatória'),
  location: z.string().min(1, 'Local é obrigatório'),
  address: z.string().optional(),
  capacity: z.number().min(1, 'Capacidade deve ser pelo menos 1').max(10000, 'Capacidade muito alta'),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  status: z.enum(['active', 'inactive']),
});

type EventFormData = z.infer<typeof eventSchema>;

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  capacity: number;
  price: number;
  status: string;
  image_url?: string;
}

interface EventFormProps {
  event?: Event;
  onSuccess: () => void;
  companyId: string;
}

export const EventForm: React.FC<EventFormProps> = ({ event, onSuccess, companyId }) => {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event?.image_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      date: event?.date || '',
      time: event?.time || '',
      location: event?.location || '',
      address: event?.address || '',
      capacity: event?.capacity || 50,
      price: event?.price || 0,
      status: (event?.status as 'active' | 'inactive') || 'active',
    },
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${companyId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (error) throw error;

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      let imageUrl = imagePreview;

      // Fazer upload da imagem se houver um arquivo selecionado
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) return; // Se falhou o upload, não continua
      }

      const eventData = {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        address: data.address,
        capacity: data.capacity,
        price: data.price,
        status: data.status,
        image_url: imageUrl,
        company_id: companyId,
      };

      if (event) {
        // Atualizar evento existente
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
      } else {
        // Criar novo evento
        const { error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o evento. Tente novamente.",
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Título do Evento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Workshop de React" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva o seu evento..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Opcional: Adicione uma descrição para atrair mais participantes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Auditório Central" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Endereço completo (opcional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidade</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="50"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Número máximo de participantes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Digite 0 para evento gratuito
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Apenas eventos ativos aparecem para confirmação
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormLabel>Imagem do Evento</FormLabel>
            <div className="mt-2 space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview do evento" 
                    className="w-full h-48 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Clique para selecionar uma imagem
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Opcional: Adicione uma imagem para tornar seu evento mais atrativo
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="submit" disabled={isLoading || uploadingImage}>
            {(isLoading || uploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploadingImage ? 'Fazendo upload...' : (event ? 'Atualizar Evento' : 'Criar Evento')}
          </Button>
        </div>
      </form>
    </Form>
  );
};