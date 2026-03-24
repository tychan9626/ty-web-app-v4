import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  isDirty: () => boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component,
) => {
  if (component.isDirty && component.isDirty()) {
    return confirm('You have unsaved changes. Are you sure you want to leave?');
  }
  return true;
};
