import { UserInitializationService } from '../../../src/domain/user/services/user-initialization.service';

describe('UserInitializationService', () => {
  let service: UserInitializationService;

  beforeEach(() => {
    service = new UserInitializationService();
  });

  // --- getDefaultModules ---

  describe('getDefaultModules', () => {
    it('should return exactly 5 default modules', () => {
      const modules = service.getDefaultModules();
      expect(modules).toHaveLength(5);
    });

    it('should return modules in correct display order', () => {
      const modules = service.getDefaultModules();

      expect(modules[0]).toEqual({ key: 'dashboard', displayOrder: 0 });
      expect(modules[1]).toEqual({ key: 'studies', displayOrder: 1 });
      expect(modules[2]).toEqual({ key: 'sports', displayOrder: 2 });
      expect(modules[3]).toEqual({ key: 'nutrition', displayOrder: 3 });
      expect(modules[4]).toEqual({ key: 'habits', displayOrder: 4 });
    });

    it('should have sequential display orders starting from 0', () => {
      const modules = service.getDefaultModules();

      modules.forEach((mod, index) => {
        expect(mod.displayOrder).toBe(index);
      });
    });

    it('should include dashboard as the first module', () => {
      const modules = service.getDefaultModules();
      expect(modules[0].key).toBe('dashboard');
    });

    it('should include studies module', () => {
      const modules = service.getDefaultModules();
      const studiesModule = modules.find((m) => m.key === 'studies');
      expect(studiesModule).toBeDefined();
    });
  });

  // --- getDefaultSettings ---

  describe('getDefaultSettings', () => {
    it('should return Europe/Madrid as default timezone', () => {
      const settings = service.getDefaultSettings();
      expect(settings.timezone).toBe('Europe/Madrid');
    });

    it('should return system as default theme', () => {
      const settings = service.getDefaultSettings();
      expect(settings.theme).toBe('system');
    });

    it('should return es as default locale', () => {
      const settings = service.getDefaultSettings();
      expect(settings.locale).toBe('es');
    });

    it('should return all three settings fields', () => {
      const settings = service.getDefaultSettings();

      expect(settings).toEqual({
        timezone: 'Europe/Madrid',
        theme: 'system',
        locale: 'es',
      });
    });
  });
});
