import { Request, Response } from 'express';
import { Permission } from '../constants/enumType';
import SharingService from '../services/sharing.service';

export default class SharingController {
  /**
   * create invitation
   * @param {Request} req
   * @param {Response} res
   */
  static invitation = async (req: Request, res: Response) => {
    const { ownerId, projectId, receiverId, choice, permission } = req.params;

    // if invalid persion -> not found page
    if (!['VIEW', 'EDIT'].includes(permission))
      return res.redirect(`${process.env.CLIENT_URL}/404/not-found`);

    // user approves the invitation
    if (choice === 'approve') {
      // store in DB the sharing
      await SharingService.updatePermission({
        projectId,
        userId: receiverId,
        permission: permission.toUpperCase() as Permission
      });

      return res.redirect(
        `${process.env.CLIENT_URL}/sharing/${permission}/${ownerId}/${projectId}`
      );
    }

    if (choice === 'decline') {
      // delete the record
      await SharingService.deleteRecord({
        authorizedUserId: receiverId,
        projectId
      });
    }
    return res.redirect(process.env.CLIENT_URL as string);
  };
}
