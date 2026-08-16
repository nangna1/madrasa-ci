// Interface d'envoi WhatsApp. Aucune implémentation réelle tant qu'un
// compte WhatsApp Business API (Meta) n'est pas obtenu. Remplacer
// `consoleMessagingProvider` par un vrai provider (Meta Cloud API ou
// fournisseur tiers type Twilio/360dialog) une fois les identifiants
// disponibles.

export interface WhatsAppMessage {
  toPhone: string;
  body: string;
  audioAttachmentUrl?: string;
}

export interface MessagingProvider {
  send(msg: WhatsAppMessage): Promise<{ ok: true } | { ok: false; error: string }>;
}

/**
 * TODO(intégration WhatsApp réelle) : brancher la Meta WhatsApp Business
 * Cloud API (ou un fournisseur tiers) une fois le compte business créé et
 * le numéro validé. En attendant, cette implémentation journalise l'envoi
 * sans contacter d'API.
 */
export const consoleMessagingProvider: MessagingProvider = {
  async send(msg) {
    console.info("[messaging-provider:stub] envoi WhatsApp", msg);
    return { ok: true };
  },
};
