import React, { useState } from 'react';
import { validateRegistration } from '@/components/ValidationHelpers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Users, UserCheck } from 'lucide-react';

interface RegistrationValidationProps {
  eventId: string;
  document: string;
  children: (validation: { isValid: boolean; message?: string; loading: boolean }) => React.ReactNode;
}

export const RegistrationValidation: React.FC<RegistrationValidationProps> = ({
  eventId,
  document,
  children
}) => {
  const [validation, setValidation] = useState<{
    isValid: boolean;
    message?: string;
    loading: boolean;
    currentRegistrations?: number;
    capacity?: number;
  }>({
    isValid: false,
    loading: false
  });

  React.useEffect(() => {
    if (!eventId || !document || document.length < 11) {
      setValidation({ isValid: false, loading: false });
      return;
    }

    const validateRegistrationData = async () => {
      setValidation(prev => ({ ...prev, loading: true }));

      try {
        const result = await validateRegistration(eventId, document);
        setValidation({
          isValid: result.isValid,
          message: result.message,
          loading: false,
          currentRegistrations: 'currentRegistrations' in result ? result.currentRegistrations : undefined,
          capacity: 'capacity' in result ? result.capacity : undefined
        });
      } catch (error) {
        setValidation({
          isValid: false,
          message: 'Erro ao validar registro',
          loading: false
        });
      }
    };

    const debounceTimer = setTimeout(validateRegistrationData, 500);
    return () => clearTimeout(debounceTimer);
  }, [eventId, document]);

  return (
    <>
      {children(validation)}
      
      {/* Mostrar status da validação */}
      {!validation.loading && document.length >= 11 && (
        <div className="space-y-2">
          {validation.isValid ? (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                Registro válido! Pode prosseguir com a inscrição.
                {validation.currentRegistrations !== undefined && validation.capacity && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {validation.currentRegistrations}/{validation.capacity} vagas ocupadas
                    </Badge>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : validation.message && (
            <Alert variant="destructive">
              {validation.message.includes('lotado') ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {validation.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {validation.loading && document.length >= 11 && (
        <Alert>
          <AlertTriangle className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            Validando registro...
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

// Hook para usar a validação de forma mais simples
export const useRegistrationValidation = (eventId: string, document: string) => {
  const [validation, setValidation] = useState<{
    isValid: boolean;
    message?: string;
    loading: boolean;
  }>({
    isValid: false,
    loading: false
  });

  React.useEffect(() => {
    if (!eventId || !document || document.length < 11) {
      setValidation({ isValid: false, loading: false });
      return;
    }

    const validateRegistrationData = async () => {
      setValidation(prev => ({ ...prev, loading: true }));

      try {
        const result = await validateRegistration(eventId, document);
        setValidation({
          isValid: result.isValid,
          message: result.message,
          loading: false
        });
      } catch (error) {
        setValidation({
          isValid: false,
          message: 'Erro ao validar registro',
          loading: false
        });
      }
    };

    const debounceTimer = setTimeout(validateRegistrationData, 500);
    return () => clearTimeout(debounceTimer);
  }, [eventId, document]);

  return validation;
};