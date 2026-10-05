import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { updateSettingsAction } from "./actions";

export default async function ReglagesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!can(user, "settings")) redirect("/dashboard");

  const restaurant = user.restaurant;

  // URL publique du menu, basée sur l'hôte courant
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const publicUrl = restaurant.slug ? `${proto}://${host}/r/${restaurant.slug}` : null;

  const qrDataUrl = publicUrl
    ? await QRCode.toDataURL(publicUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#1c1917", light: "#ffffff" },
      })
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold">Réglages & QR code</h1>
      <p className="mt-1 text-sm text-stone-500">
        Configurez votre numéro WhatsApp et imprimez le QR code de votre menu.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Formulaire */}
        <form action={updateSettingsAction} className="card space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Nom du restaurant
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={restaurant.name}
              className="input"
            />
          </div>
          <div>
            <label
              htmlFor="whatsappNumber"
              className="mb-1 block text-sm font-medium"
            >
              Numéro WhatsApp
            </label>
            <input
              id="whatsappNumber"
              name="whatsappNumber"
              defaultValue={restaurant.whatsappNumber ?? ""}
              className="input"
              placeholder="225 07 01 02 03 04"
            />
            <p className="mt-1 text-xs text-stone-500">
              Format international sans « + » (ex : 2250701020304). Les
              clients commanderont vers ce numéro.
            </p>
          </div>
          <button type="submit" className="btn btn-primary">
            Enregistrer
          </button>
        </form>

        {/* QR code */}
        <div className="card text-center">
          <h2 className="font-semibold">QR code du menu</h2>
          {qrDataUrl && publicUrl ? (
            <>
              <img
                src={qrDataUrl}
                alt={`QR code du menu de ${restaurant.name}`}
                className="mx-auto mt-4 h-56 w-56 rounded-lg border border-stone-200"
              />
              <p className="mt-3 break-all text-xs text-stone-500">
                {publicUrl}
              </p>
              <div className="mt-3 flex justify-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <a
                  href={qrDataUrl}
                  download={`qr-menu-${restaurant.slug}.png`}
                  className="btn btn-primary"
                >
                  Télécharger le QR
                </a>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  Voir le menu
                </a>
              </div>
              <p className="mt-3 text-xs text-stone-500">
                Imprimez-le et collez-le sur les tables : les clients
                scannent, choisissent et commandent via WhatsApp.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-stone-500">
              Enregistrez le formulaire pour générer le lien public et le QR
              code.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}