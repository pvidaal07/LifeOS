import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import { usersApi } from '../../api/users.api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useLogout } from '../../hooks/useAuth';
import {
  detectReviewSettingsPreset,
  getPresetSettings,
  getReviewSettingsPresetLabel,
  REVIEW_SETTINGS_PRESETS,
  type ReviewSettingsPayload,
  type ReviewSettingsPresetId,
} from '../../lib/review-settings-presets';
import { useAuthStore } from '../../stores/auth.store';
import type { UserModule, UserProfileResponse, UserSettings } from '../../types';

type ProfileFormState = {
  name: string;
  avatarUrl: string;
};

type PreferencesFormState = {
  timezone: string;
  locale: string;
  theme: string;
};

type ReviewSettingsFormState = {
  baseIntervals: string;
  perfectMultiplier: string;
  goodMultiplier: string;
  regularMultiplier: string;
  badReset: boolean;
};

const SETTINGS_QUERY_KEY = ['account-settings', 'profile'];
const MODULES_QUERY_KEY = ['account-settings', 'modules'];
const REVIEW_SETTINGS_QUERY_KEY = ['review-settings'];

const MODULE_LABELS: Record<string, string> = {
  studies: 'Estudios',
  dashboard: 'Inicio',
  reviews: 'Repasos',
  sport: 'Deporte',
  nutrition: 'Nutricion',
};

function getInitialPreferences(settings?: UserSettings | null): PreferencesFormState {
  return {
    timezone: settings?.timezone ?? 'Europe/Madrid',
    locale: settings?.locale ?? 'es',
    theme: settings?.theme ?? 'system',
  };
}

function getModuleLabel(moduleKey: string): string {
  return MODULE_LABELS[moduleKey] ?? moduleKey;
}

function toReviewSettingsForm(settings: ReviewSettingsPayload): ReviewSettingsFormState {
  return {
    baseIntervals: settings.baseIntervals.join(', '),
    perfectMultiplier: String(settings.perfectMultiplier),
    goodMultiplier: String(settings.goodMultiplier),
    regularMultiplier: String(settings.regularMultiplier),
    badReset: settings.badReset,
  };
}

function parseReviewSettingsForm(formState: ReviewSettingsFormState): ReviewSettingsPayload | null {
  const baseIntervals = formState.baseIntervals
    .split(',')
    .map((item) => parseInt(item.trim(), 10))
    .filter((item) => !isNaN(item) && item > 0);

  if (baseIntervals.length === 0) {
    return null;
  }

  const perfectMultiplier = parseFloat(formState.perfectMultiplier);
  const goodMultiplier = parseFloat(formState.goodMultiplier);
  const regularMultiplier = parseFloat(formState.regularMultiplier);

  if ([perfectMultiplier, goodMultiplier, regularMultiplier].some((value) => isNaN(value) || value < 1)) {
    return null;
  }

  return {
    baseIntervals,
    perfectMultiplier,
    goodMultiplier,
    regularMultiplier,
    badReset: formState.badReset,
  };
}

export function AccountSettingsPage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLogoutPending } = useLogout();

  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: '',
    avatarUrl: '',
  });
  const [preferencesForm, setPreferencesForm] = useState<PreferencesFormState>({
    timezone: 'Europe/Madrid',
    locale: 'es',
    theme: 'system',
  });
  const [moduleDraft, setModuleDraft] = useState<UserModule[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ReviewSettingsPresetId>('normal');
  const [reviewSettingsForm, setReviewSettingsForm] = useState<ReviewSettingsFormState>(
    toReviewSettingsForm(getPresetSettings('normal')),
  );
  const [showAdvancedReviewSettings, setShowAdvancedReviewSettings] = useState(false);

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await usersApi.getMe();
      return response.data.data as UserProfileResponse;
    },
  });

  const {
    data: modules,
    isLoading: isModulesLoading,
  } = useQuery({
    queryKey: MODULES_QUERY_KEY,
    queryFn: async () => {
      const response = await usersApi.getMyModules();
      return response.data.data as UserModule[];
    },
  });

  const {
    data: reviewSettings,
    isLoading: isReviewSettingsLoading,
  } = useQuery({
    queryKey: REVIEW_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await studiesApi.getReviewSettings();
      return response.data.data;
    },
  });

  useEffect(() => {
    if (!profile) {
      return;
    }

    setProfileForm({
      name: profile.name ?? '',
      avatarUrl: profile.avatarUrl ?? '',
    });

    setPreferencesForm(getInitialPreferences(profile.settings));
  }, [profile]);

  useEffect(() => {
    if (!modules) {
      return;
    }

    setModuleDraft(modules);
  }, [modules]);

  useEffect(() => {
    if (!reviewSettings) {
      return;
    }

    const nextPreset = detectReviewSettingsPreset(reviewSettings);
    setSelectedPreset(nextPreset);
    setReviewSettingsForm(toReviewSettingsForm(reviewSettings));
    setShowAdvancedReviewSettings(nextPreset === 'custom');
  }, [reviewSettings]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        name: profileForm.name.trim() || undefined,
        avatarUrl: profileForm.avatarUrl.trim() || undefined,
      }),
    onSuccess: (response) => {
      const updatedUser = response.data.data;

      if (authUser) {
        setUser({
          ...authUser,
          name: updatedUser.name,
          email: updatedUser.email,
          avatarUrl: updatedUser.avatarUrl ?? null,
        });
      }

      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast.success('Perfil actualizado');
    },
    onError: () => {
      toast.error('No se pudo actualizar el perfil');
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMySettings({
        timezone: preferencesForm.timezone.trim() || undefined,
        locale: preferencesForm.locale.trim() || undefined,
        theme: preferencesForm.theme.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast.success('Preferencias guardadas');
    },
    onError: () => {
      toast.error('No se pudieron guardar las preferencias');
    },
  });

  const updateModulesMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMyModules(
        moduleDraft.map((mod, index) => ({
          moduleKey: mod.moduleKey,
          isActive: mod.isActive,
          displayOrder: index,
        })),
      ),
    onSuccess: (response) => {
      const updatedModules = response.data.data;
      queryClient.setQueryData(MODULES_QUERY_KEY, updatedModules);
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast.success('Modulos actualizados');
    },
    onError: () => {
      toast.error('No se pudieron actualizar los modulos');
    },
  });

  const updateReviewSettingsMutation = useMutation({
    mutationFn: (payload: ReviewSettingsPayload) => studiesApi.updateReviewSettings(payload),
    onSuccess: (response) => {
      const updatedSettings = response.data.data;
      queryClient.setQueryData(REVIEW_SETTINGS_QUERY_KEY, updatedSettings);
      queryClient.invalidateQueries({ queryKey: REVIEW_SETTINGS_QUERY_KEY });
      setSelectedPreset(detectReviewSettingsPreset(updatedSettings));
      setReviewSettingsForm(toReviewSettingsForm(updatedSettings));
      toast.success('Configuracion de repasos guardada');
    },
    onError: () => {
      toast.error('No se pudo guardar la configuracion de repasos');
    },
  });

  const activeModulesCount = useMemo(
    () => moduleDraft.filter((moduleItem) => moduleItem.isActive).length,
    [moduleDraft],
  );

  const hasModuleChanges = useMemo(() => {
    if (!modules || modules.length !== moduleDraft.length) {
      return false;
    }

    return modules.some((savedModule, index) => {
      const draft = moduleDraft[index];
      return (
        savedModule.moduleKey !== draft.moduleKey ||
        savedModule.isActive !== draft.isActive ||
        savedModule.displayOrder !== draft.displayOrder
      );
    });
  }, [moduleDraft, modules]);

  const selectedPresetDescription = useMemo(() => {
    if (selectedPreset === 'custom') {
      return 'Detectamos una configuracion personalizada. Puedes mantenerla o cambiar a un preset.';
    }

    return REVIEW_SETTINGS_PRESETS.find((preset) => preset.id === selectedPreset)?.description ?? '';
  }, [selectedPreset]);

  const applyPreset = (presetId: Exclude<ReviewSettingsPresetId, 'custom'>) => {
    const presetSettings = getPresetSettings(presetId);
    setSelectedPreset(presetId);
    setReviewSettingsForm(toReviewSettingsForm(presetSettings));
    setShowAdvancedReviewSettings(false);
  };

  const handleSaveReviewSettings = () => {
    const parsedPayload = parseReviewSettingsForm(reviewSettingsForm);

    if (!parsedPayload) {
      toast.error('Revisa los intervalos y multiplicadores antes de guardar');
      return;
    }

    setSelectedPreset(detectReviewSettingsPreset(parsedPayload));
    updateReviewSettingsMutation.mutate(parsedPayload);
  };

  if (isProfileLoading) {
    return (
      <div className="flex h-52 items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando configuracion de cuenta...</p>
      </div>
    );
  }

  if (isProfileError || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se pudo cargar la cuenta</CardTitle>
          <CardDescription>
            Intenta refrescar la pagina o vuelve a iniciar sesion.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cuenta y configuracion</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tu identidad, tus preferencias y los modulos visibles del workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Actualiza el nombre y avatar que se muestran en la aplicacion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-text-primary">
                Nombre
              </label>
              <Input
                id="profile-name"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-text-primary">
                Email
              </label>
              <Input id="profile-email" value={profile.email} disabled />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="profile-avatar" className="mb-1 block text-sm font-medium text-text-primary">
                URL del avatar
              </label>
              <Input
                id="profile-avatar"
                value={profileForm.avatarUrl}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, avatarUrl: event.target.value }))
                }
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar perfil'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias</CardTitle>
          <CardDescription>Define localizacion y tema visual por defecto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="timezone" className="mb-1 block text-sm font-medium text-text-primary">
                Zona horaria
              </label>
              <Input
                id="timezone"
                value={preferencesForm.timezone}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({ ...prev, timezone: event.target.value }))
                }
              />
            </div>

            <div>
              <label htmlFor="locale" className="mb-1 block text-sm font-medium text-text-primary">
                Idioma
              </label>
              <Input
                id="locale"
                value={preferencesForm.locale}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({ ...prev, locale: event.target.value }))
                }
              />
            </div>

            <div>
              <label htmlFor="theme" className="mb-1 block text-sm font-medium text-text-primary">
                Tema
              </label>
              <select
                id="theme"
                value={preferencesForm.theme}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({ ...prev, theme: event.target.value }))
                }
                className="flex h-10 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <option value="system">Sistema</option>
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => updatePreferencesMutation.mutate()}
              disabled={updatePreferencesMutation.isPending}
            >
              {updatePreferencesMutation.isPending
                ? 'Guardando...'
                : 'Guardar preferencias'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="review-settings">
        <CardHeader>
          <CardTitle>Configuracion de repasos</CardTitle>
          <CardDescription>
            Este es el editor principal de repasos. Elige un preset o personaliza en modo avanzado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isReviewSettingsLoading ? (
            <p className="text-sm text-muted-foreground">Cargando configuracion de repasos...</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                {REVIEW_SETTINGS_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      selectedPreset === preset.id
                        ? 'border-primary bg-brand-primary-50'
                        : 'border-border bg-surface hover:bg-surface-muted'
                    }`}
                    aria-pressed={selectedPreset === preset.id}
                  >
                    <p className="text-sm font-semibold text-text-primary">{preset.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
                <p className="text-sm font-medium text-text-primary">
                  Modo actual: {getReviewSettingsPresetLabel(selectedPreset)}
                </p>
                <p className="text-xs text-muted-foreground">{selectedPresetDescription}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-input bg-surface-muted px-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Editar valores avanzados</p>
                  <p className="text-xs text-muted-foreground">
                    Ajusta intervalos y multiplicadores manualmente. Si no coincide con un preset quedara como personalizado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedReviewSettings((prev) => !prev)}
                  className={`relative inline-flex h-11 w-16 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 ${
                    showAdvancedReviewSettings
                      ? 'border-primary bg-primary'
                      : 'border-input bg-surface'
                  }`}
                  aria-label={showAdvancedReviewSettings ? 'Modo avanzado activado' : 'Modo avanzado desactivado'}
                  aria-pressed={showAdvancedReviewSettings}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-surface transition-transform ${
                      showAdvancedReviewSettings ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {showAdvancedReviewSettings && (
                <div className="space-y-4 rounded-lg border border-border bg-surface px-4 py-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Intervalos base (dias)</label>
                    <Input
                      type="text"
                      value={reviewSettingsForm.baseIntervals}
                      onChange={(event) =>
                        setReviewSettingsForm((prev) => ({ ...prev, baseIntervals: event.target.value }))
                      }
                      placeholder="1, 7, 30, 90"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Perfecto (x)</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        value={reviewSettingsForm.perfectMultiplier}
                        onChange={(event) =>
                          setReviewSettingsForm((prev) => ({ ...prev, perfectMultiplier: event.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Bien (x)</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        value={reviewSettingsForm.goodMultiplier}
                        onChange={(event) =>
                          setReviewSettingsForm((prev) => ({ ...prev, goodMultiplier: event.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Regular (x)</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        value={reviewSettingsForm.regularMultiplier}
                        onChange={(event) =>
                          setReviewSettingsForm((prev) => ({ ...prev, regularMultiplier: event.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-input bg-surface-muted px-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Resultado "Mal" reinicia</p>
                      <p className="text-xs text-muted-foreground">
                        {reviewSettingsForm.badReset
                          ? 'Un mal resultado vuelve al intervalo base (dia 1)'
                          : 'Un mal resultado reduce el intervalo a la mitad'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setReviewSettingsForm((prev) => ({ ...prev, badReset: !prev.badReset }))
                      }
                      className={`relative inline-flex h-11 w-16 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 ${
                        reviewSettingsForm.badReset
                          ? 'border-primary bg-primary'
                          : 'border-input bg-surface'
                      }`}
                      aria-label={reviewSettingsForm.badReset ? 'Reinicio activado' : 'Reinicio desactivado'}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-surface transition-transform ${
                          reviewSettingsForm.badReset ? 'translate-x-9' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveReviewSettings}
                  disabled={updateReviewSettingsMutation.isPending}
                >
                  {updateReviewSettingsMutation.isPending
                    ? 'Guardando...'
                    : 'Guardar configuracion de repasos'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modulos activos</CardTitle>
          <CardDescription>
            Selecciona que areas quieres mostrar en el menu principal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isModulesLoading ? (
            <p className="text-sm text-muted-foreground">Cargando modulos...</p>
          ) : moduleDraft.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay modulos configurados.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {moduleDraft.map((moduleItem) => (
                <label
                  key={moduleItem.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-4 py-3"
                >
                  <span className="text-sm font-medium text-text-primary">
                    {getModuleLabel(moduleItem.moduleKey)}
                  </span>
                  <input
                    type="checkbox"
                    checked={moduleItem.isActive}
                    onChange={(event) =>
                      setModuleDraft((prev) =>
                        prev.map((currentModule) =>
                          currentModule.id === moduleItem.id
                            ? { ...currentModule, isActive: event.target.checked }
                            : currentModule,
                        ),
                      )
                    }
                    className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {activeModulesCount} de {moduleDraft.length} modulos activos
            </p>
            <Button
              onClick={() => updateModulesMutation.mutate()}
              disabled={updateModulesMutation.isPending || !hasModuleChanges}
            >
              {updateModulesMutation.isPending ? 'Guardando...' : 'Guardar modulos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contrasena</CardTitle>
          <CardDescription>
            El cambio de contrasena todavia no esta disponible desde la app web.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Este flujo depende de un endpoint backend que aun no existe. Mientras tanto, puedes
            seguir usando tu sesion actual sin bloqueos.
          </p>
          <Button variant="secondary" disabled>
            Cambio de contrasena pendiente
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acciones de cuenta</CardTitle>
          <CardDescription>Gestiona tu sesion actual.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="ghost"
            onClick={() => logout()}
            disabled={isLogoutPending}
          >
            {isLogoutPending ? 'Cerrando sesion...' : 'Cerrar sesion'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
