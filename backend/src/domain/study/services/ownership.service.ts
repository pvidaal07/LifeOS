import { OwnershipViolationError } from '../../common';

export class OwnershipService {
  /**
   * Assert that the resource belongs to the requesting user.
   * Throws OwnershipViolationError if the IDs don't match.
   */
  assertOwnership(resourceOwnerId: string, requestingUserId: string): void {
    if (resourceOwnerId !== requestingUserId) {
      throw new OwnershipViolationError();
    }
  }
}
