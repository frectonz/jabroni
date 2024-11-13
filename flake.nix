{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs = {
        nixpkgs.follows = "nixpkgs";
      };
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      rust-overlay,
    }:
    let
      forAllSystems =
        fn:
        let
          systems = [ "x86_64-linux" ];
          overlays = [ (import rust-overlay) ];
        in
        nixpkgs.lib.genAttrs systems (
          system:
          fn (
            import nixpkgs {
              inherit system overlays;
            }
          )
        );
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          buildInputs = [
            pkgs.just
            pkgs.deno
            pkgs.bacon
            pkgs.openssl
            pkgs.cargo-dist
            pkgs.pkg-config
            pkgs.rust-analyzer
            pkgs.rust-bin.stable.latest.default
          ];
        };
      });

      packages = forAllSystems (pkgs:
        let
          rustPlatform = pkgs.makeRustPlatform {
            cargo = pkgs.rust-bin.stable.latest.default;
            rustc = pkgs.rust-bin.stable.latest.default;
          };

          pname = "jabroni";
          version = "0.1.0";
        in rec {
          default = rustPlatform.buildRustPackage {
            inherit pname version;
            src = ./.;
            buildInputs = [ pkgs.openssl ];
            nativeBuildInputs = [ pkgs.pkg-config ];
            cargoLock.lockFile = ./Cargo.lock;
          };

          image = pkgs.dockerTools.buildLayeredImage {
            name = pname;
            tag = "latest";
            created = "now";
            config.Cmd = [ "${default}/bin/jabroni" ];
          };

          deploy = pkgs.writeShellScriptBin "deploy" ''
            ${pkgs.skopeo}/bin/skopeo --insecure-policy copy docker-archive:${image} docker://docker.io/frectonz/jabroni:${version} --dest-creds="frectonz:$ACCESS_TOKEN"
            ${pkgs.skopeo}/bin/skopeo --insecure-policy copy docker://docker.io/frectonz/jabroni:${version} docker://docker.io/frectonz/jabroni:latest --dest-creds="frectonz:$ACCESS_TOKEN"
          '';
        });

      formatter = forAllSystems (pkgs: pkgs.nixfmt-rfc-style);
    };
}
